import * as v from "valibot";

export const Actions = {
  SIGN_IN: "SIGN_IN",
  WHOAMI: "WHOAMI",
  SIGN_OUT: "SIGN_OUT",
  CREATE_DISCUSSION: "CREATE_DISCUSSION",
  CREATE_REPLY: "CREATE_REPLY",
  GET_DISCUSSION: "GET_DISCUSSION",
} as const;

export const Table = {
  AUTH: "AUTH",
  DISCUSSION: "DISCUSSION",
  COMMENT: "COMMENT"
} as const

const ActionSchemas = {
  [Actions.SIGN_IN]: v.array(v.string([v.minLength(1)]), [v.minLength(1)]),
  [Actions.SIGN_OUT]: v.array(v.string([v.minLength(1)]), [v.minLength(1)]),
  [Actions.CREATE_DISCUSSION]: v.array(v.string([v.minLength(1)]), [v.minLength(1)]),
  [Actions.GET_DISCUSSION]: v.array(v.string([v.minLength(1)]), [v.minLength(1)]),
  [Actions.CREATE_REPLY]: v.array(v.string([v.minLength(1)]), [v.minLength(1)]),
  [Actions.WHOAMI]: v.array(v.null_('No data'), [v.maxLength(0)])
}

export const RequestBodySchema = v.object({
  requestId: v.string([v.length(7), v.regex(/[a-zA-Z]/)]),
  action: v.enum_(Actions),
  data: v.nullable(v.optional(v.array(v.string()))),
  type: v.enum_(Table)
}, [
  v.forward(
    v.custom(({ action, data }) => {
      const parseResult = v.safeParse(ActionSchemas[action], data)
      if (parseResult.success) {
        return true
      }
      return false
    },
      "Bad data"),
    ['data'])
])

export const RequestBodySchema2 = v.object({
  requestId: v.string([v.length(7), v.regex(/[a-zA-Z]/)]),
  action: v.enum_(Actions),
  data: v.nullable(v.optional(v.array(v.string()))),
  type: v.enum_(Table)
})

export type MessageBody = v.Output<typeof RequestBodySchema>
export type Message = {
  key: string,
  data: MessageBody
}

export type ParsedBody = {
  key: string,
  type: keyof typeof Table,
  data: MessageBody
}
