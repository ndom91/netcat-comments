import * as v from "valibot";
import { createHash } from "node:crypto";
import { Table, Actions, requestBodySchema } from "./types"

export const validateBody = (body: { requestId: string, action: string, data: string }) => {
  return v.parse(requestBodySchema, body);
};

const getMessageType = (action: keyof typeof Actions) => {
  const authActions = [Actions.SIGN_IN, Actions.SIGN_OUT, Actions.WHOAMI];
  const discussionActions = [Actions.CREATE_DISCUSSION, Actions.CREATE_REPLY];

  // check if action is part of either group
  // @ts-expect-error needs to be clarified
  if (authActions.includes(action)) {
    return Table.AUTH;
    // @ts-expect-error needs to be clarified
  } else if (discussionActions.includes(action)) {
    return Table.DISCUSSION;
  }
}

export const parseMessage = (ip: string, bodyString: string) => {
  const rawBody = bodyString.split("|").reduce((acc, segment, i) => {
    if (!Object.values(acc).includes(segment)) {
      // TODO parse Discussion messages
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
  }, {
    requestId: "",
    action: "",
    data: "",
  });

  const parsedBody = validateBody(rawBody)

  return {
    key: createHash('sha256').update(ip).digest('hex'),
    type: getMessageType(parsedBody.action!),
    data: parsedBody
  }
}
