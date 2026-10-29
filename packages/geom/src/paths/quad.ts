import { Data } from "effect";
import { Point } from "../primitives/point";
import { lazy } from "../../../utils/src/lazy";

import { Bezier } from "bezier-js";
import type { SegmentContract } from "./segment";
import { Rect } from "../primitives/rect";
import { Vector } from "../primitives/vector";
import { fail } from "../../../utils/src/fail";

export class Quad
  extends Data.TaggedClass("Quad")<{
    start: Point;
    control: Point;
    end: Point;
  }>
  implements SegmentContract
{
  #peer = lazy(
    () =>
      new Bezier(
        this.start.x,
        this.start.y,
        this.control.x,
        this.control.y,
        this.end.x,
        this.end.y,
      ),
  );

  #bounds = lazy(() => {
    const bbox = this.#peer().bbox();
    return Rect.fromCoords(bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max);
  });

  #length = lazy(() => this.#peer().length());

  get bounds() {
    return this.#bounds();
  }

  get length(): number {
    return this.#length();
  }

  point(t: number): Point {
    return new Point(this.#peer().get(t));
  }

  tangent(t: number): Vector {
    const tangent = this.#peer().derivative(t);
    return new Vector({ w: tangent.x, h: tangent.y });
  }

  normal(t: number): Vector {
    const normal = this.#peer().normal(t);
    return new Vector({ w: normal.x, h: normal.y });
  }

  project(pt: Point): number {
    return this.#peer().project(pt).t ?? fail("Projection failed");
  }

  crossings(start: Point, end: Point): number[] {
    const intersections = this.#peer().lineIntersects({ p1: start, p2: end });
    return intersections;
  }
}
