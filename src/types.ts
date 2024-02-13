import * as v from "valibot";

export const Actions = {
  SIGN_IN: "SIGN_IN",
  WHOAMI: "WHOAMI",
  SIGN_OUT: "SIGN_OUT",
  CREATE_DISCUSSION: "CREATE_DISCUSSION",
  CREATE_REPLY: "CREATE_REPLY",
} as const;

export const requestBodySchema = v.object({
  requestId: v.string([v.length(7), v.regex(/[a-zA-Z]/)]),
  action: v.nullable(v.optional(v.enum_(Actions))),
  data: v.nullable(v.optional(v.string())),
});

export type MessageBody = v.Output<typeof requestBodySchema>
export type Message = { key: string, data: MessageBody }

export type ParsedAuthBody = {
  key: string,
  data: MessageBody
}

export const Table = {
  AUTH: "AUTH",
  DISCUSSION: "DISCUSSION"
} as const
