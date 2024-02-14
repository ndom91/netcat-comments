import * as v from "valibot";
import { createHash } from "node:crypto";
import { ParsedBody, Table, Actions, RequestBodySchema } from "./types"

export const validateBody = (body: { requestId: string, action: string, data: string[] }) => {
  return v.parse(RequestBodySchema, body);
};

const getMessageType = (action: keyof typeof Actions) => {
  const authActions = [Actions.SIGN_IN, Actions.SIGN_OUT, Actions.WHOAMI];
  const discussionActions = [Actions.CREATE_DISCUSSION, Actions.GET_DISCUSSION]
  const commentActions = [Actions.CREATE_REPLY];

  // check if action is part of either group
  // @ts-expect-error needs to be clarified
  if (authActions.includes(action)) {
    return Table.AUTH;
    // @ts-expect-error needs to be clarified
  } else if (discussionActions.includes(action)) {
    return Table.DISCUSSION;
    // @ts-expect-error needs to be clarified
  } else if (commentActions.includes(action)) {
    return Table.COMMENT;
  }
}

/**
 * Parse message from client for the first time
 * Extract initial important fields like requestId and actionId
 * and push the rest of the data into an array for later consumption.
 */
export const parseMessage = (ip: string, bodyString: string): ParsedBody => {
  const rawBody = bodyString.split("|").reduce((body, segment, i) => {
    if (!Object.values(body).includes(segment)) {
      if (i === 0) body.requestId = segment;
      if (i === 1) {
        body.action = segment as keyof typeof Actions
        body.type = getMessageType(segment as keyof typeof Actions)!
      }
      if (i >= 2) {
        (body.data as string[]).push(segment)
      }
    }
    return body;
  }, {
    requestId: "",
    action: "",
    data: [],
    type: "",
  })

  const parsedBody = validateBody(rawBody)

  return {
    key: createHash('sha256').update(ip).digest('hex'),
    type: parsedBody.type,
    data: parsedBody
  }
}
