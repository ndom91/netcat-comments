import * as v from "valibot";
import { createHash } from "node:crypto";
import { Actions, requestBodySchema } from "./types"
import { defaultBody } from "./auth"
import type { MessageBody, Message } from "./types"

export const validateBody = (body: MessageBody) => {
  return v.parse(requestBodySchema, body);
};

export const parseAuthMessage = (ip: string, bodyString: string) => {
  const rawBody: MessageBody = bodyString.split("|").reduce((acc, segment, i) => {
    if (!Object.values(acc).includes(segment)) {
      if (i === 0) acc.requestId = segment;
      if (i === 1) {
        if (Object.keys(Actions).includes(segment)) {
          acc.action = segment as keyof typeof Actions
        } else if (acc.action === Actions.WHOAMI) {
          acc.data = segment;
        }
      }
      if (i === 2) {
        acc.data = segment;
      }
    }
    return acc;
  }, structuredClone(defaultBody));

  return {
    key: createHash('sha256').update(ip).digest('hex'),
    data: validateBody(rawBody)
  }
}
