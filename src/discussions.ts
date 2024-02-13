import { Actions } from "./types"
import { MemoryDatabase } from "./db"
import type { Message } from "./types"

export class NetcatDiscussions {
  #db: typeof MemoryDatabase.prototype

  constructor() {
    this.#db = new MemoryDatabase()
  }

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
  }

  createReply(msg: Message) {
  }
}
