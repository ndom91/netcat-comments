import * as v from "valibot";
import { randomUUID, createHash } from "node:crypto";
import { Message, Table, Actions, RequestBodySchema } from "./types"
import { Authentication } from "../auth";

export const validateBody = (body: { requestId: string, action: string, data: string[], type: string }) => {
  return v.parse(RequestBodySchema, body);
};

/*
 * Parse message type for later use with "database" adapter
 */
const getMessageType = (action: keyof typeof Actions) => {
  const authActions = [Actions.SIGN_IN, Actions.SIGN_OUT, Actions.WHOAMI];
  const discussionActions = [Actions.CREATE_REPLY, Actions.CREATE_DISCUSSION, Actions.GET_DISCUSSION, Actions.LIST_DISCUSSIONS]

  // check if action is part of either group
  // @ts-expect-error needs to be clarified
  if (authActions.includes(action)) {
    return Table.AUTH;
    // @ts-expect-error needs to be clarified
  } else if (discussionActions.includes(action)) {
    return Table.DISCUSSION;
  }
}

/**
 * Parse message from client for the first time
 * Extract initial fields like requestId and classify action type
 * push the rest of the data into an array for later consumption.
 */
export const parseMessage = (userId: string, bodyString: string): Message => {
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
    type: "",
    data: [],
  })

  const parsedBody = validateBody(rawBody)

  return {
    /*
     * TODO: Find a better way to key the user session
     * ngrok returns '127.0.0.1' for all users :/
     */
    userId,
    type: parsedBody.type,
    body: parsedBody
  }
}

export const generateId = () => {
  return randomUUID().split('-')[0]
}

export const validateSession = (userId: string) => {
  const auth = new Authentication()
  if (!auth.getUserById(userId)) {
    throw new Error("No session found.")
  }
}
