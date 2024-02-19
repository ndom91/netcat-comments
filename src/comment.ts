import { db } from "./db"
import { Actions } from "./types"
import { Logger, loggerLevels } from "./logger";
import { Authentication } from "./auth";
import { generateId } from "./utils";
import { type Message, Table } from "./types"

const logger = new Logger({ level: loggerLevels.DEBUG, prefix: "DISC" })
const auth = new Authentication()

export class Comment {
  #db: typeof db = db

  handleAction(parsedMessage: Message) {
    switch (parsedMessage.body.action) {
      case Actions.CREATE_DISCUSSION:
        logger.debug('discussion.create')
        if (!auth.getUser(parsedMessage.userId)) {
          logger.debug('discussion.create', 'attempted without session.')
          return 'No session found.'
        }
        return this.createDiscussion(parsedMessage);
      case Actions.GET_DISCUSSION:
        logger.debug('discussion.get', parsedMessage.body?.data?.[0]!)
        if (!auth.getUser(parsedMessage.userId)) {
          logger.debug('discussion.get', 'attempted without session.')
          return 'No session found.'
        }
        return this.getDiscussion(parsedMessage);
      case Actions.LIST_DISCUSSIONS:
        logger.debug('discussion.list', parsedMessage.body?.data?.[0]!)
        if (!auth.getUser(parsedMessage.userId)) {
          logger.debug('discussion.list', 'attempted without session.')
          return 'No session found.'
        }
        return this.listDiscussions(parsedMessage);
      case Actions.CREATE_REPLY:
        logger.debug('comment.create')
        if (!auth.getUser(parsedMessage.userId)) {
          logger.debug('comment.create', 'attempted without session.')
          return 'No session found.'
        }
        return this.createReply(parsedMessage);
      default:
        break;
    }
  }

  createDiscussion(msg: Message) {
    const discussionId = generateId()
    const user = auth.getUser(msg.userId)

    const discussionUserReference = msg.body.data?.[0] as string
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
    this.#db.insert(Table.DISCUSSION_REFERENCES, { key: discussionUserReference, value: discussionId })
    this.#db.insert(Table.DISCUSSION, { key: discussionId, value: JSON.stringify(dbRecord) })
    return `${msg.body.requestId}|${discussionId}`
  }

  getDiscussion(msg: Message) {
    const discussionId = msg.body.data?.[0]
    if (!discussionId) return "Missing discussionId"
    const discussionData = this.#db.get(Table.DISCUSSION, { key: discussionId })

    if (!discussionData) {
      return "Couldn't find discussion"
    }

    const discussion = JSON.parse(discussionData)
    const messagesString = discussion.data.messages.map((msg: { body: string, username: string }) => {
      return `${msg.username}|"${msg.body.replace(/"/g, '""')}"`
    }).join(',')
    return `${msg.body.requestId}|${discussionId}|${discussion.data.discussionUserReference}|(${messagesString})`
  }

  listDiscussions(msg: Message) {
    const discussionReference = msg.body.data?.[0] as string

    const discussionIds = this.#db.contains(Table.DISCUSSION_REFERENCES, { query: discussionReference })
    if (!discussionIds) {
      return "Couldn't find discussion based on the provided reference"
    }

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
    const discussionId = msg.body.data?.[0] as string
    const replyMsg = msg.body.data?.[1] as string
    const discussionData = this.#db.get(Table.DISCUSSION, { key: discussionId })
    if (!discussionData) {
      return "Couldn't create reply"
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
