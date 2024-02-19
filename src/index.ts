import net from "node:net";
import { Buffer } from "node:buffer";
import { pipeline } from "node:stream/promises"

import { Table } from "./types";
import { Comment } from "./comment";
import { ValiError } from "valibot";
import { parseMessage } from "./utils";
import { Authentication } from "./auth";
import { Logger, loggerLevels } from "./logger";

const logger = new Logger({ level: loggerLevels.DEBUG })

const server = net.createServer((socket) => {
  const auth = new Authentication()
  const comment = new Comment()

  pipeline(
    socket,
    async function*(source) {
      const ip = source.remoteAddress
      logger.debug('connection.opened', ip!)
      for await (const chunk of source) {
        try {
          const msg = Buffer.from(chunk).toString().replace('\n', '')
          const parsedMessage = parseMessage(ip!, msg)

          let response
          if (parsedMessage.type === Table.AUTH) {
            response = auth.handleAction(parsedMessage)
          } else if (parsedMessage.type === Table.DISCUSSION) {
            response = comment.handleAction(parsedMessage)
          }
          yield `${response}\n`
        } catch (e) {
          logger.debug(String(e))
          if (e instanceof ValiError) {
            yield e.issues.map(issue => `Input "${issue.input}" invalid: ${issue.message}`).join('\n') + '\n'
          }
        }
      }
    },
    socket
  )
});

server.listen(5000, "127.0.0.1");
