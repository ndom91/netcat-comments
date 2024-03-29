import * as v from "valibot"

/*
 * Enum of valid actions
 */
export const Actions = {
  SIGN_IN: "SIGN_IN",
  WHOAMI: "WHOAMI",
  SIGN_OUT: "SIGN_OUT",
  CREATE_DISCUSSION: "CREATE_DISCUSSION",
  CREATE_REPLY: "CREATE_REPLY",
  LIST_DISCUSSIONS: "LIST_DISCUSSIONS",
  GET_DISCUSSION: "GET_DISCUSSION",
} as const

/*
 * "Database" tables
 */
export const Table = {
  AUTH: "AUTH",
  DISCUSSION: "DISCUSSION",
  DISCUSSION_REFERENCES: "DISCUSSION_REFERENCES",
} as const

/*
 * Valibot schemas for the data for the various action types
 */
const ActionSchemas = {
  [Actions.SIGN_IN]: v.array(v.string([v.minLength(1)]), [v.minLength(1)]),
  [Actions.SIGN_OUT]: v.array(v.null_("No data"), [v.maxLength(0)]),
  [Actions.CREATE_DISCUSSION]: v.array(v.string([v.minLength(1)]), [
    v.minLength(1),
  ]),
  [Actions.LIST_DISCUSSIONS]: v.array(
    v.string([v.minLength(1), v.maxLength(7)])
  ),
  [Actions.GET_DISCUSSION]: v.array(v.string([v.minLength(1)]), [
    v.minLength(1),
  ]),
  [Actions.CREATE_REPLY]: v.array(v.string([v.minLength(1)]), [v.minLength(1)]),
  [Actions.WHOAMI]: v.array(v.null_("No data"), [v.maxLength(0)]),
}

/*
 * Valibot schema used to ensure we're only handling valid input
 */
export const RequestBodySchema = v.object(
  {
    requestId: v.string([v.regex(/([a-z]{7})/, "The requestId is not valid")]),
    action: v.enum_(Actions),
    data: v.nullable(v.optional(v.array(v.string()))),
    type: v.enum_(Table),
  },
  [
    v.forward(
      v.custom(({ action, data }) => {
        const parseResult = v.safeParse(ActionSchemas[action], data)
        if (parseResult.success) {
          return true
        }
        return false
      }, "Bad data"),
      ["data"]
    ),
  ]
)

export type MessageBody = v.Output<typeof RequestBodySchema>

export type Message = {
  userId: string
  type: keyof typeof Table
  body: MessageBody
}

export type CommentData = {
  userId: string
  username: string
  body: string
}
