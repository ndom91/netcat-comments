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
        return this.createDiscussion(parsedMessage);
      case Actions.CREATE_REPLY:
        return this.createReply(parsedMessage);
      default:
        break;
    }
  }

  createDiscussion(msg: Message) {
    this.#db.insert(Table.DISCUSSION, { key: msg.key, value: JSON.stringify(msg.data) })
  }

  createReply(msg: Message) {
    this.#db.insert(Table.COMMENT, { key: msg.key, value: JSON.stringify(msg.data) })
  }

  getDiscussion(msg: Message) {
    this.#db.get(Table.DISCUSSION, { key: msg.key })
  }
}
