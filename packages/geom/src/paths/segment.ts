import { Point } from "../primitives/point";
import { Rect } from "../primitives/rect";
import { Vector } from "../primitives/vector";

export interface SegmentContract {
  start: Point;
  end: Point;
  bounds: Rect;
  length: number;
  point(t: number): Point;
  tangent(t: number): Vector;
  normal(t: number): Vector;
  project(pt: Point): number;
  crossings(start: Point, end: Point): number[];
}
