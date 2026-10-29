import { expect, test } from "vite-plus/test";
import { getTag, tag, tagged, taggedConstructor } from "../src/tagged";

test("Tagged struct has tag", () => {
  const o = { x: 1 };
  const x = tagged("a", o);
  expect(o).not.toBe(x);
  expect(x.x).toBe(1);
  expect(getTag(x)).toBe("a");
  expect(Object.keys(x)).toEqual(["x"]);
  expect(Object.getOwnPropertySymbols(x)).toEqual([tag]);
  expect(Object.getOwnPropertySymbols(o)).toEqual([]);
});

test("Tagged constructor returns proper object", () => {
  const o = { y: 2 };
  const ctor = taggedConstructor("b")<{ y: number }>;
  const x = ctor(o);
  expect(o).not.toBe(x);
  expect(x.y).toBe(2);
  expect(getTag(x)).toBe("b");
  expect(Object.keys(x)).toEqual(["y"]);
  expect(Object.getOwnPropertySymbols(x)).toEqual([]);
  expect(Object.getOwnPropertySymbols(o)).toEqual([]);
});
