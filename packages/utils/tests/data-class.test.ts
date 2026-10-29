import Immutable from "immutable";
import { expect, test } from "vite-plus/test";
import { DataClass } from "../src/data-class";

class Dta extends DataClass({ a: 1, b: 2 }) {
  #hu: number = Math.random();
  get hu() {
    return this.#hu;
  }
}

test("Data class can be created", () => {
  const dta = new Dta({ a: 10 });
  expect(dta.a).toBe(10);
  expect(dta.b).toBe(2);
});

test("Data to be value object", () => {
  const dta = new Dta({ a: 10 });
  expect(Immutable.isValueObject(dta)).toBeTruthy();
  expect(Immutable.hash(dta)).toBe(312);
});

test("Data class ignore private fields", () => {
  const a = new Dta({ a: 10 });
  const b = new Dta({ a: 10 });
  expect(a.hu).not.toBe(b.hu);
  expect(Immutable.hash(a)).toBe(312);
  expect(Immutable.hash(b)).toBe(312);
  expect(Immutable.is(a, b)).toBeTruthy();
});

test("Data class to be immutable", () => {
  const a = new Dta({ a: 10 });
  expect(() => ((a as any).a = 20)).toThrow();
  expect(a.a).toBe(10);
});

test("Data class clone properly", () => {
  const a = new Dta({ a: 10 });
  const b = a.copy();
  expect(a).not.toBe(b);
  expect(Immutable.is(a, b)).toBeTruthy();
  expect(typeof b.hu).toBe("number");
  expect(a.hu).not.toBe(b.hu);
});

test("Data class to not add own properties", () => {
  const a = new Dta({ a: 10 });
  expect(Object.keys(a)).toEqual(["a", "b"]);
});
