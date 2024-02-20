import net from "node:net";
import { Buffer } from "node:buffer";
import { pipeline } from "node:stream/promises"
import { ValiError } from "valibot";

import { Table } from "./lib/types";
import { Comment } from "./comment";
import { parseMessage, generateId } from "./lib/utils";
import { Authentication } from "./auth";
import { Logger, loggerLevels } from "./lib/logger";
import { randomUUID } from "node:crypto"

const logger = new Logger({ level: loggerLevels.DEBUG, prefix: "SERV" })

const server = net.createServer((socket) => {
  const auth = new Authentication()
  const comment = new Comment()

  try {
    /* Stream Pipeline to handle the data
     * - Handle input from the tcp socket,
     * - Pass it onto an async generator to handle/transform the data
     * - Send it back out of the socket to the recipient
     */
    pipeline(
      socket,
      async function*(source) {
        const ip = source.remoteAddress
        const userId = randomUUID()
        logger.debug('connection.opened', ip!, userId)
        for await (const chunk of source) {
          try {
            const msg = Buffer.from(chunk).toString().replace('\n', '')
            const parsedMessage = parseMessage(userId, msg)

            let response
            if (parsedMessage.type === Table.AUTH) {
              response = auth.handleAction(parsedMessage)
            } else if (parsedMessage.type === Table.DISCUSSION) {
              response = comment.handleAction(parsedMessage)
            }
            yield `${response}\n`
          } catch (e: any) {
            logger.debug(String(e))
            yield `${e.message}\n`
            if (e instanceof ValiError) {
              yield e.issues.map(issue => `Input "${issue.input}" invalid: ${issue.message}`).join('\n') + '\n'
            }
          }
        }
      },
      socket,
    )
  } catch (e: any) {
    logger.error('socket.error', e)
  }
});

server.listen(5000, "127.0.0.1");
