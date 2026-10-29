import { Data } from "effect";
import { Point } from "../primitives/point";
import type { SegmentContract } from "./segment";
import { Rect } from "../primitives/rect";
import { Vector } from "../primitives/vector";
import { lazy } from "../../../utils/src/lazy";

export class Line
  extends Data.TaggedClass("LineTo")<{ start: Point; end: Point }>
  implements SegmentContract
{
  #bounds = lazy(() => Rect.fromPoints(this.start, this.end));
  get bounds(): Rect {
    return this.#bounds();
  }
  length = this.start.distanceTo(this.end);

  point(t: number): Point {
    return new Point({
      x: this.start.x + t * (this.end.x - this.start.x),
      y: this.start.y + t * (this.end.y - this.start.y),
    });
  }

  tangent(t: number): Vector {
    return this.end.minus(this.start);
  }

  normal(t: number): Vector {
    return this.tangent(t).perpendicular().normalize();
  }

  project(pt: Point): number {
    /* Project a point onto the line segment and return the parameter t corresponding to the closest point on the line */
    const dx = this.end.x - this.start.x;
    const dy = this.end.y - this.start.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) return 0;
    const t = ((pt.x - this.start.x) * dx + (pt.y - this.start.y) * dy) / lengthSquared;
    return Math.max(0, Math.min(1, t));
  }

  crossings(start: Point, end: Point): number[] {
    /* Determine the parameter t values where the segment defined by start and end crosses this line segment */
    const dx = this.end.x - this.start.x;
    const dy = this.end.y - this.start.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) return [];
    const tStart = ((start.x - this.start.x) * dx + (start.y - this.start.y) * dy) / lengthSquared;
    const tEnd = ((end.x - this.start.x) * dx + (end.y - this.start.y) * dy) / lengthSquared;
    const crossings: number[] = [];
    if (tStart >= 0 && tStart <= 1) crossings.push(tStart);
    if (tEnd >= 0 && tEnd <= 1) crossings.push(tEnd);
    return crossings;
  }
}
