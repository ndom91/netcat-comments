import net from "node:net";
import { ValiError } from "valibot";
import { Buffer } from "node:buffer";
import { pipeline } from "node:stream/promises"
import { buildRequestObject, validateBody } from "./utils";

const server = net.createServer((socket) => {
  pipeline(
    socket,
    async function*(source) {
      for await (const chunk of source) {
        try {
          const messages = Buffer.from(chunk).toString().split('\n').filter(Boolean)
          const parsedMessages = messages.map(msg => {
            const rawBodyObject = buildRequestObject(msg)
            const body = validateBody(rawBodyObject)
            return body
          })

          let response = parsedMessages[0].requestId
          if (parsedMessages[0].data) {
            response += `|${parsedMessages[0].data}`
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

server.listen(1337, "127.0.0.1");
