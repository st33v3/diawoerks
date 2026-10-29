import { Bench } from "tinybench";
import { tagged, taggedConstructor } from "../src/tagged";

const bench = new Bench({
  name: "simple benchmark gc",
  setup: (_task, mode) => {
    // Run the garbage collector before warmup at each cycle
    if (mode === "warmup" && typeof globalThis.gc === "function") {
      globalThis.gc();
    }
  },
  time: 300,
});

let x: unknown = undefined;
function doSomething(obj: unknown) {
  if (typeof obj === "object") x = obj;
}

bench.add("500 simple object creation", () => {
  const arr = [];
  for (let i = 0; i < 500; i++) {
    arr.push({ x: i });
  }
  doSomething(arr);
});

const template = { x: 0 };
bench.add("500 spread object creation", () => {
  const arr = [];
  for (let i = 0; i < 500; i++) {
    arr.push({ ...template });
  }
  doSomething(arr);
});

bench.add("500 tagged object creation", () => {
  const arr = [];
  for (let i = 0; i < 500; i++) {
    arr.push(tagged("a", { x: i }));
  }
  doSomething(arr);
});

const ctor = taggedConstructor("a")<{ x: number }>;

bench.add("500 tagged constructor object creation", () => {
  const arr = [];
  for (let i = 0; i < 500; i++) {
    arr.push(ctor({ x: i }));
  }
  doSomething(arr);
});

await bench.run();

console.log(bench.name);
console.table(bench.table());
