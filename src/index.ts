import net, { type Socket } from "node:net";
import { Buffer } from "node:buffer";
import { buildRequestObject, validateBody } from "./utils";
import { ValiError } from "valibot";

const server = net.createServer((socket: Socket) => {
  socket
    .on('data', (chunk: Buffer | string) => {
      try {
        const bodyString = Buffer.from(chunk).toString()
        const rawBodyObject = buildRequestObject(bodyString)
        const body = validateBody(rawBodyObject)

        console.log('body', body)
      } catch (e) {
        if (e instanceof ValiError) {
          const issuesResponse = e.issues.map(issue => issue.message).join(', ')
          console.log(issuesResponse)
        }
      }
    })
  socket.pipe(socket);
});

server.listen(1337, "127.0.0.1");
