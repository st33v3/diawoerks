import { Data } from "effect";
import { Vector } from "./vector";
import { nearlyEqual } from "../tools/compare";

export class Point extends Data.TaggedClass("Point")<{ x: number; y: number }> {
  public minus(other: Point): Vector {
    return new Vector({ w: this.x - other.x, h: this.y - other.y });
  }

  public plus(other: Vector): Point {
    return new Point({ x: this.x + other.w, y: this.y + other.h });
  }

  public sameAs(other: Point): boolean {
    return nearlyEqual(this.x, other.x) && nearlyEqual(this.y, other.y);
  }

  public squaredDistanceTo(other: Point): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return dx * dx + dy * dy;
  }

  public distanceTo(other: Point): number {
    return Math.sqrt(this.squaredDistanceTo(other));
  }
}
