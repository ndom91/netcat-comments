import net from "node:net";
import { ValiError } from "valibot";
import { Buffer } from "node:buffer";
import { pipeline } from "node:stream/promises"
import { NetcatAuthentication } from "./auth";
import { parseAuthMessage } from "./utils";

const server = net.createServer((socket) => {
  const auth = new NetcatAuthentication()
  pipeline(
    socket,
    async function*(source) {
      const ip = source.remoteAddress
      console.log('sourceIp', ip)
      for await (const chunk of source) {
        try {
          const msg = Buffer.from(chunk).toString().replace('\n', '')
          const parsedMessage = parseAuthMessage(ip!, msg)
          const response = auth.handleAction(parsedMessage)
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
