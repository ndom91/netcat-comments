import net, { type Socket } from "node:net";
import { Buffer } from "node:buffer";
import { buildRequestObject, validateBody } from "./utils";
import { ValiError } from "valibot";

const server = net.createServer((socket: Socket) => {
  socket
    .on('data', (chunk: Buffer | string) => {
      try {
        const messages = Buffer.from(chunk).toString().split('\n').filter(Boolean)
        console.log('\n\nbodyString', messages)
        const parsedMessages = messages.map(msg => {
          const rawBodyObject = buildRequestObject(msg)
          console.log('\n\nrawBodyObject', rawBodyObject)
          const body = validateBody(rawBodyObject)
          console.log('\n\nbody', body)
          return body
        })

        console.log('parsedMessages', parsedMessages)
      } catch (e) {
        if (e instanceof ValiError) {
          console.log(e)
          const issuesResponse = e.issues.map(issue => `Input "${issue.input}" invalid: ${issue.message}`).join('\n')
          console.log(issuesResponse)
        }
      }
    })
  socket.pipe(socket);
});

server.listen(1337, "127.0.0.1");
