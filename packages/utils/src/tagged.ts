import { Data } from "effect";

export const tag: unique symbol = Symbol("tag");

export interface Tagged<S extends string> {
  readonly [tag]: S;
}

export function hasTag(value: unknown): value is Tagged<string> {
  return typeof value === "object" && value !== null && tag in value;
}

export function isTagged<S extends string>(value: unknown, tagValue: S): value is Tagged<S> {
  return hasTag(value) && value[tag] === tagValue;
}

export function getTag<T extends Tagged<string>>(value: T): Tags<T> {
  return value[tag];
}

export function tagged<S extends string, T extends {}>(tagValue: S, value: T): T & Tagged<S> {
  return {
    ...value,
    [tag]: tagValue,
  };
}

/**
 * Creates constructor function that tags objects by setting tagged prototype to them (i.e. the tag is not directly on the object).
 * @param tagValue value of tag to be set on the result
 * @param value object to be tagged with the specified tag value
 * @returns constructor function that tags the given object with the specified tag value
 */
export function taggedConstructor<S extends string>(
  tagValue: S,
): <T extends {}>(obj: T) => T & Tagged<S> {
  const proto = Object.create(Object.prototype);
  proto[tag] = tagValue;
  return (obj) => Object.setPrototypeOf({ ...obj }, proto);
}

export type Tags<T extends Tagged<string>> = T[typeof tag];

export type MatchResult<
  TS extends string,
  HS extends Record<TS, (a: never) => unknown>,
> = HS[TS] extends (a: never) => infer A ? A : never;

export function match<
  TS extends Tagged<string>,
  HS extends { [K in Tags<TS>]: (value: Extract<TS, { [tag]: K }>) => unknown },
>(value: TS, handlers: HS): MatchResult<Tags<TS>, HS> {
  if (!hasTag(value)) {
    throw new Error("Value is not tagged");
  }
  const t = getTag(value);
  const handler = handlers[t];
  if (!handler) {
    throw new Error(`No handler for tag: ${t}`);
  }
  return handler(value as never) as never;
}
