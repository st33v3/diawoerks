import { expect, test } from "vite-plus/test";
import { tuple } from "../src/tuple";
import assert from "node:assert";
import Immutable from "immutable";

test("Tuple copies original", () => {
  const arr = [1, 2, "Hi"] as const;
  const tup = tuple(...arr);
  const tup2 = tuple(1, 2, "Hi");
  expect(tup.length).toBe(arr.length);
  assert.deepStrictEqual(tup, arr);
  assert.deepStrictEqual(tup, tup2);
});

test("Tuple is value object", () => {
  const arr = [1, 2, "Hi"] as const;
  const tup = tuple(...arr);
  const tup2 = tuple(1, 2, "Hi");
  expect(tup !== tup2).toBeTruthy();
  expect(Immutable.is(tup, tup2)).toBeTruthy();
  expect(Immutable.isValueObject(tup)).toBeTruthy();
});

test("Tuple is read-only and not affect original", () => {
  const arr = [1, 2, "Hi"];
  const tup = tuple(...arr);
  expect((tup as unknown) !== arr).toBeTruthy();
  arr.push("New Element"); //ok to add to original array
  expect(() => (tup as unknown as any).push("New Element")).toThrow();
});

test("Tuple has array methods", () => {
  const arr = [1, 2, "Hi"];
  const tup = tuple(...arr);
  expect(tup.map((x) => x)).toEqual(arr);
  expect(tup.filter((x) => typeof x === "number")).toEqual([1, 2]);
  expect(tup.reduce((acc: number, x) => acc + (typeof x === "number" ? x : 0), 0)).toBe(3);
});
