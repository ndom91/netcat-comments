import { db } from "./lib/db"
import { type Message, Actions, Table } from "./lib/types"
import { Logger, loggerLevels } from "./lib/logger";
import { validateSession } from "./lib/utils";

const logger = new Logger({ level: loggerLevels.DEBUG, prefix: "AUTH" })

export class Authentication {
  #db: typeof db = db

  handleAction(parsedMessage: Message) {
    switch (parsedMessage.body.action) {
      case Actions.SIGN_IN:
        const [username] = parsedMessage.body?.data!
        logger.debug('user.signIn', username)

        return this.signIn(parsedMessage);
      case Actions.SIGN_OUT:
        logger.debug('user.signOut')
        validateSession(parsedMessage.userId)

        return this.signOut(parsedMessage);
      case Actions.WHOAMI:
        logger.debug('user.whoami')
        validateSession(parsedMessage.userId)

        return this.whoami(parsedMessage);
      default:
        break;
    }
  }

  signIn(msg: Message) {
    this.#db.insert(Table.AUTH, { key: msg.userId, value: JSON.stringify(msg.body) })
    return msg.body.requestId
  }

  signOut(msg: Message) {
    const savedSession = this.#db.get(Table.AUTH, { key: msg.userId })
    if (!savedSession) {
      return 'No session found.'
    }
    this.#db.delete(Table.AUTH, { key: msg.userId })
    return msg.body.requestId
  }

  whoami(msg: Message): string | undefined {
    const savedSession = this.#db.get(Table.AUTH, { key: msg.userId })
    if (!savedSession) {
      return 'No session found.'
    }
    const savedMsg = JSON.parse(savedSession)
    return `${msg.body.requestId}|${savedMsg?.data}`
  }

  getUser(key: string): null | Record<string, string> {
    const session = this.#db.get(Table.AUTH, { key })
    if (!session) {
      return null
    }
    return JSON.parse(session)
  }
}
