import * as v from "valibot";

const defaultBody = {
  requestId: "",
  action: "SIGN_IN",
  data: "",
} as MessageBody

const Actions = {
  SIGN_IN: "SIGN_IN",
  WHOAMI: "WHOAMI",
  SIGN_OUT: "SIGN_OUT",
} as const;

const requestBodySchema = v.object({
  requestId: v.string([v.length(7), v.regex(/[a-zA-Z]/)]),
  action: v.nullable(v.optional(v.enum_(Actions))),
  data: v.nullable(v.optional(v.string())),
});

type MessageBody = v.Output<typeof requestBodySchema>

export const validateBody = (body: MessageBody) => {
  return v.parse(requestBodySchema, body);
};

export class NetcatAuthentication {
  #sessions: Map<string, string>;

  constructor() {
    this.#sessions = new Map();
  }

  parseMessage(bodyString: string) {
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

    return validateBody(rawBody)
  }

  handleAction(parsedMessage: MessageBody) {
    switch (parsedMessage.action) {
      case Actions.SIGN_IN:
        return this.signIn(parsedMessage);
      case Actions.SIGN_OUT:
        return this.signOut(parsedMessage);
      case Actions.WHOAMI:
        return this.whoami(parsedMessage);
      default:
        break;
    }
  }

  signIn(msg: MessageBody) {
    this.#sessions.set(msg.requestId, JSON.stringify(msg))
    return msg.requestId
  }

  signOut(msg: MessageBody) {
    this.#sessions.delete(msg.requestId)
    return msg.requestId
  }

  whoami(msg: MessageBody): string | undefined {
    const savedSession = this.#sessions.get(msg.requestId)
    if (!savedSession) {
      return undefined
    }
    const message = JSON.parse(savedSession)
    console.log('savedSession.msg', message)
    return `${message.requestId}|${message?.data}`
  }
}
