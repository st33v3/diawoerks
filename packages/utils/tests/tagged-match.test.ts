import { match, tagged } from "../src/tagged";
import { expect, test } from "vite-plus/test";

const ta = tagged<"a", { x: number }>("a", { x: 1 });
const tb = tagged("b", { y: "s" });

test("Match applies proper handler", () => {
  function f(b: boolean) {
    return b ? ta : tb;
  }

  const x = match(f(true), {
    a: (value) => value.x + 1,
    b: (value) => value.y + "!",
  });

  expect(x).toBe(2);

  const y = match(f(false), {
    a: (value) => value.x + 1,
    b: (value) => value.y + "!",
  });

  expect(y).toBe("s!");
});
