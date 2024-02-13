import type { Output } from "valibot";
import * as v from "valibot";

export const defaultBody = {
  requestId: "",
  action: "",
  data: "",
};

export const Actions = {
  SIGN_IN: "SIGN_IN",
  WHOAMI: "WHOAMI",
  SIGN_OUT: "SIGN_OUT",
} as const;

const requestBodySchema = v.object({
  requestId: v.string([v.length(7), v.regex(/[a-zA-Z]/)]),
  action: v.nullable(v.optional(v.enum_(Actions))),
  data: v.nullable(v.optional(v.string())),
});

export const validateBody = (body: typeof defaultBody) => {
  console.log("INPUT BODY", body);
  // try {
  return v.parse(requestBodySchema, body);
  // } catch (e) {
  //   console.log(e);
  // }
};

export const buildRequestObject = (bodyString: string) => {
  return bodyString.split("|").reduce((acc, rawSegment, i) => {
    const segment = rawSegment.replace("\n", "");
    if (!Object.values(acc).includes(segment)) {
      if (i === 0) acc.requestId = segment;
      if (i === 1) {
        if (Object.keys(Actions).includes(segment)) {
          acc.action = segment;
        } else {
          acc.data = segment;
        }
      }
      if (i === 2) acc.data = segment;
    }
    return acc;
  }, defaultBody);
};
