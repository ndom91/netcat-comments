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
    switch (parsedMessage.data.action) {
      case Actions.CREATE_DISCUSSION:
        logger.debug('discussion.create')
        if (!auth.getUser(parsedMessage.key)) {
          logger.debug('discussion.create', 'attempted without session.')
          return 'No session found.'
        }
        return this.createDiscussion(parsedMessage);
      case Actions.GET_DISCUSSION:
        logger.debug('discussion.get', parsedMessage.data?.data?.[0]!)
        if (!auth.getUser(parsedMessage.key)) {
          logger.debug('discussion.get', 'attempted without session.')
          return 'No session found.'
        }
        return this.getDiscussion(parsedMessage);
      case Actions.LIST_DISCUSSIONS:
        logger.debug('discussion.list', parsedMessage.data?.data?.[0]!)
        if (!auth.getUser(parsedMessage.key)) {
          logger.debug('discussion.list', 'attempted without session.')
          return 'No session found.'
        }
        return this.listDiscussions(parsedMessage);
      case Actions.CREATE_REPLY:
        logger.debug('comment.create')
        if (!auth.getUser(parsedMessage.key)) {
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
    msg.data.discussionId = discussionId
    this.#db.insert(Table.DISCUSSION, { key: msg.key, value: JSON.stringify(msg.data) })
    return `${msg.data.requestId}|${discussionId}`
  }

  getDiscussion(msg: Message) {
    this.#db.get(Table.DISCUSSION, { key: msg.key })
  }

  listDiscussions(msg: Message) {
    // TODO: Get multiple based on reference prefix
    const discussionData = this.#db.get(Table.DISCUSSION, { key: msg.key })
    if (discussionData) {
      const discussion = JSON.parse(discussionData)
      console.log('disc', discussion)
      return `${discussion.data}`
    }
  }

  createReply(msg: Message) {
    this.#db.insert(Table.COMMENT, { key: msg.key, value: JSON.stringify(msg.data) })
  }
}
