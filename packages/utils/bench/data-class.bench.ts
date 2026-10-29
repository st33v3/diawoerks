import { Bench } from "tinybench";
import { DataClass } from "../src/data-class.ts";
import Immutable from "immutable";

class Point {
  constructor(
    public x: number = 0,
    public y: number = 0,
  ) {}
}

class DPoint extends DataClass({ x: 0, y: 0 }) {}

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

function pointArray(size: number): Point[] {
  const arr: Point[] = [];
  for (let i = 0; i < size; i++) {
    arr.push(new Point(i, i));
  }
  return arr;
}

function dpointArray(size: number): DPoint[] {
  const arr: DPoint[] = [];
  for (let i = 0; i < size; i++) {
    arr.push(new DPoint({ x: i, y: i }));
  }
  return arr;
}

const p = new Point(0, 0);
const dp = new DPoint({ x: 0, y: 0 });
const a = pointArray(500);
const b = dpointArray(500);

bench
  .add("Instantiate 500 Points", () => {
    for (let i = 0; i < 500; i++) {
      const p = new Point(i, i);
      Object.freeze(p);
      doSomething(p);
    }
  })
  .add("Instantiate 500 DPoints", () => {
    for (let i = 0; i < 500; i++) {
      const p = new DPoint({ x: i, y: i });
      doSomething(p);
    }
  })
  .add("Create 500 Points array", () => {
    doSomething(pointArray(500));
  })
  .add("Create 500 DPoints array", () => {
    doSomething(dpointArray(500));
  })
  .add("Compare points array", () => {
    doSomething(a.reduce((acc, cur) => acc + (Object.is(cur, p) ? 1 : 0), 0));
  })
  .add("Compare dpoints array", () => {
    doSomething(b.reduce((acc, cur) => acc + (Immutable.is(cur, dp) ? 1 : 0), 0));
  });

await bench.run();

console.log(bench.name);
console.table(bench.table());
