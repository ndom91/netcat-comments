import { Actions } from "./types"
import { db } from "./db"
import { type Message, Table } from "./types"
import { Logger, loggerLevels } from "./logger";

const logger = new Logger({ level: loggerLevels.DEBUG, prefix: "DISC" })

export class Comment {
  #db: typeof db = db

  handleAction(parsedMessage: Message) {
    switch (parsedMessage.data.action) {
      case Actions.CREATE_DISCUSSION:
        logger.debug('discussion.create')
        return this.createDiscussion(parsedMessage);
      case Actions.GET_DISCUSSION:
        logger.debug('discussion.get', parsedMessage.data?.data?.[0]!)
        return this.createReply(parsedMessage);
      case Actions.LIST_DISCUSSIONS:
        logger.debug('discussion.list', parsedMessage.data?.data?.[0]!)
        return this.createReply(parsedMessage);
      case Actions.CREATE_REPLY:
        logger.debug('comment.create')
        return this.createReply(parsedMessage);
      default:
        break;
    }
  }

  createDiscussion(msg: Message) {
    this.#db.insert(Table.DISCUSSION, { key: msg.key, value: JSON.stringify(msg.data) })
  }

  getDiscussion(msg: Message) {
    this.#db.get(Table.DISCUSSION, { key: msg.key })
  }

  listDiscussions(msg: Message) {
    // TODO: Get multiple based on reference prefix
    this.#db.get(Table.DISCUSSION, { key: msg.key })
  }

  createReply(msg: Message) {
    this.#db.insert(Table.COMMENT, { key: msg.key, value: JSON.stringify(msg.data) })
  }
}
