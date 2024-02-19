import { db } from "./db"
import { Actions, Table } from "./types"
import { Logger, loggerLevels } from "./logger";
import type { Message } from "./types"

const logger = new Logger({ level: loggerLevels.DEBUG, prefix: "AUTH" })

export class Authentication {
  #db: typeof db = db

  handleAction(parsedMessage: Message) {
    switch (parsedMessage.data.action) {
      case Actions.SIGN_IN:
        logger.debug('user.signIn', parsedMessage.data?.data?.[0]!)
        return this.signIn(parsedMessage);
      case Actions.SIGN_OUT:
        logger.debug('user.signOut', parsedMessage.data?.data?.[0]!)
        if (!this.getUser(parsedMessage.key)) {
          logger.debug('user.signOut', 'attempted without session.')
          return 'No session found.'
        }
        return this.signOut(parsedMessage);
      case Actions.WHOAMI:
        logger.debug('user.whoami', parsedMessage.data?.data?.[0]!)
        if (!this.getUser(parsedMessage.key)) {
          logger.debug('user.whoami', 'attempted without session.')
          return 'No session found.'
        }
        return this.whoami(parsedMessage);
      default:
        break;
    }
  }

  signIn(msg: Message) {
    this.#db.insert(Table.AUTH, { key: msg.key, value: JSON.stringify(msg.data) })
    return msg.data.requestId
  }

  signOut(msg: Message) {
    const savedSession = this.#db.get(Table.AUTH, { key: msg.key })
    if (!savedSession) {
      return 'No session found.'
    }
    this.#db.delete(Table.AUTH, { key: msg.key })
    return msg.data.requestId
  }

  whoami(msg: Message): string | undefined {
    const savedSession = this.#db.get(Table.AUTH, { key: msg.key })
    if (!savedSession) {
      return 'No session found.'
    }
    const savedMsg = JSON.parse(savedSession)
    return `${msg.data.requestId}|${savedMsg?.data}`
  }

  getUser(key: string): null | Record<string, string> {
    const session = this.#db.get(Table.AUTH, { key })
    if (session) {
      return JSON.parse(session)
    }
    return null
  }
}
