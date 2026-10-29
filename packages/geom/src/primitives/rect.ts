import { Data } from "effect";
import { Point } from "./point";
import { Vector } from "./vector";
import { lazy } from "../../../utils/src/lazy";

export class Rect extends Data.TaggedClass("Rect")<{ start: Point; size: Vector }> {
  #end = lazy(() => new Point({ x: this.start.x + this.size.w, y: this.start.y + this.size.h }));
  #center = lazy(
    () => new Point({ x: this.start.x + this.size.w / 2, y: this.start.y + this.size.h / 2 }),
  );
  get end() {
    return this.#end();
  }
  get center() {
    return this.#center();
  }

  static fromPoints(min: Point, max: Point): Rect {
    return new Rect({ start: min, size: new Vector({ w: max.x - min.x, h: max.y - min.y }) });
  }

  static fromCenter(center: Point, size: Vector): Rect {
    return new Rect({
      start: new Point({ x: center.x - size.w / 2, y: center.y - size.h / 2 }),
      size,
    });
  }

  static fromCoords(x1: number, y1: number, x2: number, y2: number): Rect {
    return new Rect({
      start: new Point({ x: x1, y: y1 }),
      size: new Vector({ w: x2 - x1, h: y2 - y1 }),
    });
  }
}
