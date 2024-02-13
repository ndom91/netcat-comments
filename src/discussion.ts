import { Actions } from "./types"
import { db } from "./db"
import type { Message } from "./types"

export class NetcatDiscussion {
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
    this.#db.insert("DISCUSSION", { key: msg.key, value: JSON.stringify(msg.data) })
  }

  createReply(msg: Message) {
  }
}
