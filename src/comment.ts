import { db } from "./lib/db"
import { Logger, loggerLevels } from "./lib/logger";
import { Authentication } from "./auth";
import { generateId } from "./lib/utils";
import { validateSession } from "./lib/utils";
import { type Message, Table, Actions } from "./lib/types"

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
    const user = auth.getUser(msg.userId)

    const [discussionUserReference] = msg.body.data!

    const dbRecord = {
      userId: msg.userId,
      type: msg.type,
      data: {
        discussionId,
        discussionUserReference,
        messages: [{
          body: msg.body.data?.[1],
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
      return `${msg.username}|"${msg.body.replace(/"/g, '""')}"`
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
      .reverse()

    if (!discussionsData) {
      return "Couldn't find discussion"
    }

    // Build return string of discussions and their messages
    const discussionsReturnString = discussionsData.map((discussion) => {
      const { discussionUserReference: reference, discussionId: id, messages } = discussion.data
      const messagesString = messages.map((msg: { body: string, username: string }) => {
        return `${msg.username}|"${msg.body.replace(/"/g, '""')}"`
      }).join(',')
      return `(${id}|${reference}|(${messagesString}))`
    })

    return `${msg.body.requestId}|${discussionsReturnString}`
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
      username: auth.getUser(msg.userId)?.data[0]
    })

    this.#db.update(Table.DISCUSSION, { key: discussionId, value: JSON.stringify(discussion) })
    return msg.body.requestId
  }
}
