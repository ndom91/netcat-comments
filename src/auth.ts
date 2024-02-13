import { Actions } from "./types"
import { MemoryDatabase } from "./db"
import type { Message } from "./types"

export class NetcatAuthentication {
  #db: typeof MemoryDatabase.prototype

  constructor() {
    const db = new MemoryDatabase()
    this.#db = db
  }

  handleAction(parsedMessage: Message) {
    switch (parsedMessage.data.action) {
      case Actions.SIGN_IN:
        return this.signIn(parsedMessage);
      case Actions.SIGN_OUT:
        return this.signOut(parsedMessage);
      case Actions.WHOAMI:
        return this.whoami(parsedMessage);
      default:
        break;
    }
  }

  signIn(msg: Message) {
    this.#db.insert(msg.key, JSON.stringify(msg.data))
    return msg.data.requestId
  }

  signOut(msg: Message) {
    this.#db.delete(msg.key)
    return msg.data.requestId
  }

  whoami(msg: Message): string | undefined {
    const savedSession = this.#db.get(msg.key)
    if (!savedSession) {
      return undefined
    }
    const savedMsg = JSON.parse(savedSession)
    console.log('savedSession.msg', savedMsg)
    return `${msg.data.requestId}|${savedMsg?.data}`
  }
}
