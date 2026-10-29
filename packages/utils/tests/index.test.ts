import { Record } from "immutable";
import { expect, test } from "vite-plus/test";
import { Data } from "effect";

class A extends Record({ a: 0, b: "" }) {
  #p = Math.random();
  public get p() {
    return this.#p;
  }
}

test("Record comparison", () => {
  const a = new A({ a: 0 });
  const b = new A();
  const c = new A({ a: 1 });
  expect(a.equals(b)).toBe(true);
  expect(a.equals(c)).toBe(false);
  expect(a).not.toBe(b);
  expect(a.p).not.toBe(b.p);
});

test("X", () => {
  // const af = Record({a: 0, b: ""});
  // console.dir(af);
  // console.dir(af.prototype);
  // console.dir(Object.getPrototypeOf(af.prototype));
  // const a = new A({a:0});
  // console.dir(a);
});

test("Mutations", () => {
  const z = Data.tuple(1, 2, 3);
  //Object.freeze(z);
  (z as any).push(6);
  const o = {};
  Object.defineProperty(o, "hash", {
    value: 123,
    writable: false,
    enumerable: false,
    configurable: false,
  });
});
