import { Actions } from "./types"
import type { MessageBody, Message } from "./types"

export const defaultBody = {
  requestId: "",
  action: "SIGN_IN",
  data: "",
} as MessageBody

export class NetcatAuthentication {
  #sessions: Map<string, string>;

  constructor() {
    this.#sessions = new Map();
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
    this.#sessions.set(msg.key, JSON.stringify(msg.data))
    return msg.data.requestId
  }

  signOut(msg: Message) {
    this.#sessions.delete(msg.key)
    return msg.data.requestId
  }

  whoami(msg: Message): string | undefined {
    const savedSession = this.#sessions.get(msg.key)
    if (!savedSession) {
      return undefined
    }
    const savedMsg = JSON.parse(savedSession)
    console.log('savedSession.msg', savedMsg)
    return `${msg.data.requestId}|${savedMsg?.data}`
  }
}
