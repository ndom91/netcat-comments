import net from "node:net";
import { ValiError } from "valibot";
import { Buffer } from "node:buffer";
import { pipeline } from "node:stream/promises"
import { NetcatAuthentication } from "./auth";
import { NetcatDiscussion } from "./discussion";
import { parseMessage } from "./utils";
import { Logger, loggerLevels } from "./logger";

const logger = new Logger({ level: loggerLevels.DEBUG })

const server = net.createServer((socket) => {
  const auth = new NetcatAuthentication()
  const discussion = new NetcatDiscussion()

  pipeline(
    socket,
    async function*(source) {
      const ip = source.remoteAddress
      logger.debug('sourceIp', ip!)
      for await (const chunk of source) {
        try {
          const msg = Buffer.from(chunk).toString().replace('\n', '')
          const parsedMessage = parseMessage(ip!, msg)

          let response
          if (parsedMessage.type === 'AUTH') {
            response = auth.handleAction(parsedMessage)
          } else if (parsedMessage.type === 'DISCUSSION') {
            response = discussion.handleAction(parsedMessage)
          }
          yield `${response}\n`
        } catch (e) {
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
