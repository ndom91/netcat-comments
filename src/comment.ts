import { db } from "./lib/db"
import { Logger, loggerLevels } from "./lib/logger";
import { Authentication, socketMap } from "./auth";
import { generateId } from "./lib/utils";
import { validateSession } from "./lib/utils";
import { Table, Actions } from "./lib/types"
import type { Message, CommentData } from "./lib/types"

const logger = new Logger({ level: loggerLevels.DEBUG, prefix: "DISC" })
const auth = new Authentication()

export class Comment {
  #db: typeof db = db

  handleAction(parsedMessage: Message) {
    switch (parsedMessage.body.action) {
      case Actions.CREATE_DISCUSSION:
        const [createDiscussionUserReference, createDiscussionMessage] = parsedMessage.body?.data!
        logger.debug('discussion.create', createDiscussionUserReference, createDiscussionMessage)

        // Ensure user is logged in
        validateSession(parsedMessage.userId)

        return this.createDiscussion(parsedMessage);
      case Actions.GET_DISCUSSION:
        const [getDiscussionId] = parsedMessage.body?.data!
        logger.debug('discussion.get', getDiscussionId)

        validateSession(parsedMessage.userId)

        return this.getDiscussion(parsedMessage);
      case Actions.LIST_DISCUSSIONS:
        const [listDiscussionUserReferencePrefix] = parsedMessage.body?.data!
        logger.debug('discussion.list', listDiscussionUserReferencePrefix)

        validateSession(parsedMessage.userId)

        return this.listDiscussions(parsedMessage);
      case Actions.CREATE_REPLY:
        const [createReplyDiscussionId, createReplyMessage] = parsedMessage.body?.data!
        logger.debug('discussion.create_reply', createReplyDiscussionId, createReplyMessage)

        validateSession(parsedMessage.userId)

        return this.createReply(parsedMessage);
      default:
        break;
    }
  }

  createDiscussion(msg: Message) {
    const discussionId = generateId()
    const user = auth.getUserById(msg.userId)

    const [discussionUserReference] = msg.body.data!

    const dbRecord = {
      userId: msg.userId,
      type: msg.type,
      data: {
        discussionId,
        discussionUserReference,
        messages: [{
          body: msg.body.data?.[1],
          userId: msg.userId,
          username: user?.data[0]
        }]
      }
    }

    // Save the discussion, but also a map of discussionId <=> discussionUserReferences
    this.#db.insert(Table.DISCUSSION_REFERENCES, { key: discussionUserReference, value: discussionId })
    this.#db.insert(Table.DISCUSSION, { key: discussionId, value: JSON.stringify(dbRecord) })
    return `${msg.body.requestId}|${discussionId}`
  }

  getDiscussion(msg: Message) {
    const [discussionId] = msg.body.data!
    if (!discussionId) {
      return "Missing discussionId"
    }

    const discussionData = this.#db.get(Table.DISCUSSION, { key: discussionId })

    if (!discussionData) {
      return "Couldn't find discussion"
    }

    const discussion = JSON.parse(discussionData)

    // Build return string of discussion messages
    const messagesString = discussion.data.messages.map((msg: { body: string, username: string }) => {
      const msgBodyString = msg.body.includes(",")
        ? `"${msg.body.replace(/"/g, '""')}"`
        : `${msg.body.replace(/"/g, '""')}`
      return `${msg.username}|${msgBodyString}`
    }).join(',')
    return `${msg.body.requestId}|${discussionId}|${discussion.data.discussionUserReference}|(${messagesString})`
  }

  listDiscussions(msg: Message) {
    const [discussionReferencePrefix] = msg.body.data!

    // Look up discussionIds based on reference prefixes
    const discussionIds = this.#db.findByPrefix(Table.DISCUSSION_REFERENCES, { query: discussionReferencePrefix })
    if (!discussionIds) {
      return "Couldn't find discussion based on the provided reference"
    }

    // Fetch all discussion data based on array of discussionIds
    const discussionsData = Object
      .values(discussionIds)
      .map((discussionId) => {
        const discussionData = this.#db.get(Table.DISCUSSION, { key: discussionId as string })
        if (discussionData) {
          return JSON.parse(discussionData)
        }
        return null
      })
      .filter(Boolean)

    if (!discussionsData) {
      return "Couldn't find discussion"
    }

    // Build return string of discussions and their messages
    const discussionsReturnString = discussionsData.map((discussion) => {
      const { discussionUserReference: reference, discussionId: id, messages } = discussion.data
      const messagesString = messages.map((msg: { body: string, username: string }) => {
        const msgBodyString = msg.body.includes(",")
          ? `"${msg.body.replace(/"/g, '""')}"`
          : `${msg.body.replace(/"/g, '""')}`
        return `${msg.username}|${msgBodyString}`
      }).join(',')
      return `${id}|${reference}|(${messagesString})`
    })

    return `${msg.body.requestId}|(${discussionsReturnString})`
  }

  createReply(msg: Message) {
    const [discussionId, replyMsg] = msg.body.data!

    const discussionData = this.#db.get(Table.DISCUSSION, { key: discussionId })
    if (!discussionData) {
      return "Couldn't create reply, discussion doesn't exist"
    }

    const discussion = JSON.parse(discussionData)
    discussion.data.messages.push({
      body: replyMsg,
      userId: msg.userId,
      username: auth.getUserById(msg.userId)?.data[0]
    })

    this.#db.update(Table.DISCUSSION, { key: discussionId, value: JSON.stringify(discussion) })
    this.publishUpdates(msg.userId, discussionId)
    return msg.body.requestId
  }

  publishUpdates(sendingUserId: string, discussionId: string) {
    const discussionData = this.#db.get(Table.DISCUSSION, { key: discussionId })
    if (!discussionData) {
      throw new Error("Cannot publish updates, discussion not found")
    }
    const discussion = JSON.parse(discussionData)

    // Build userId list of members of the thread
    const memberUserIds = new Set(discussion.data.messages
      .map((msg: CommentData) => msg.userId)
      .filter((userId: string) => userId !== sendingUserId)
    )

    // Build userId list of anyone mentioned in the thread
    const mentionedUserIds = new Set(discussion.data.messages
      // Loop over all messages
      .map((msg: CommentData) => {
        const matchedUsernames = msg.body.match(/@(\w){2,}/g)
        if (matchedUsernames) {
          // Loop over all mentions per message
          return matchedUsernames
            .map(username => {
              const userId = auth.getUserByUsername(username)
              return userId
            })
            .filter((userId) => {
              // Filter out sending user
              return userId !== sendingUserId
            })
        }
      })
      .flat()
      .filter(Boolean)
    )

    // Merge userIds, leverage Sets again to dedupe lists
    const userIds = new Set([...memberUserIds, ...mentionedUserIds])

    // Publish updates to all subscribers
    userIds.forEach((userId) => {
      const socket = socketMap.get(userId)
      if (socket) {
        socket.write(`DISCUSSION_UPDATED|${discussionId}\n`)
      }
    })
  }
}
