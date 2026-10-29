import type { ValueObject } from "immutable";
import Immutable from "immutable";
import { getHash, setHash, setNoHash } from "./hash.ts";

const arrayValueObject: ValueObject = {
  equals(other: unknown) {
    const arr = this as unknown as unknown[];
    if (!Immutable.isValueObject(other)) return false;
    if (this.hashCode() !== Immutable.hash(other)) return false;
    if (!Array.isArray(other)) return false;
    return arr.length === other.length && arr.every((v, i) => Immutable.is(v, other[i]));
  },
  hashCode(): number {
    return getHash(this);
  },
};

const arrayProto = Object.assign(Object.create(Array.prototype), arrayValueObject);

export function tuple<A extends ReadonlyArray<unknown>>(...args: A): Readonly<A> & ValueObject {
  Object.setPrototypeOf(args, arrayProto);
  setNoHash(args);
  let hc = 0;
  for (let i = 0; i < args.length; i++) {
    hc = (hc * 31 + Immutable.hash(args[i])) | 0;
  }
  setHash(args, hc);
  Object.freeze(args);
  return args as never;
}
