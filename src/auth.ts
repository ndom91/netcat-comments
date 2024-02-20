import type { Socket } from "node:net"
import { db } from "./lib/db"
import { type Message, Actions, Table } from "./lib/types"
import { Logger, loggerLevels } from "./lib/logger";
import { validateSession } from "./lib/utils";

const logger = new Logger({ level: loggerLevels.DEBUG, prefix: "AUTH" })

export const socketMap = new Map()

export class Authentication {
  #db: typeof db = db

  handleAction(parsedMessage: Message, socket?: Socket) {
    switch (parsedMessage.body.action) {
      case Actions.SIGN_IN:
        const [username] = parsedMessage.body?.data!
        logger.debug('user.signIn', username)

        // Save socket reference in global userId <-> socket dictionary
        // for later use in pub/sub mechanism
        socketMap.set(parsedMessage.userId, socket)

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

    // Remove session from Auth table and map of active sockets
    this.#db.delete(Table.AUTH, { key: msg.userId })
    socketMap.delete(msg.userId)

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

  getUserById(key: string): null | Record<string, string> {
    const session = this.#db.get(Table.AUTH, { key })
    if (!session) {
      return null
    }
    return JSON.parse(session)
  }


  getUserByUsername(username: string): null | string {
    const allSessionsMap = this.#db.getAll(Table.AUTH)
    if (!allSessionsMap) {
      logger.debug("Failed to get Auth table")
      return null
    }

    const matchedUserId: string[] = []
    // Iterate over entire Auth session table, pushing
    // username matches to `matchedUserId` array
    allSessionsMap.forEach((sessionData, userId) => {
      const session = JSON.parse(sessionData)
      if (session.data[0] === username.replace("@", "")) {
        matchedUserId.push(userId)
      }
    })
    // We should ideally only have 1 match per username. If
    // there are 2 or more matches or 0 matches, something has gone wrong
    if (!matchedUserId.length || matchedUserId.length > 1) {
      logger.debug("Unable to find username")
    }

    return matchedUserId[0]
  }
}
