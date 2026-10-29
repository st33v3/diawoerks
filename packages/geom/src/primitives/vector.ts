import { Data } from "effect";
import { lazy } from "../../../utils/src/lazy";
import { nearlyEqual } from "../tools/compare";

export class Vector extends Data.TaggedClass("Vector")<{ w: number; h: number }> {
  #length = lazy(() => Math.sqrt(this.squaredLength));

  public angle() {
    return Math.atan2(this.h, this.w);
  }

  public plus(other: Vector): Vector {
    return new Vector({ w: this.w + other.w, h: this.h + other.h });
  }

  public minus(other: Vector): Vector {
    return new Vector({ w: this.w - other.w, h: this.h - other.h });
  }
  public scale(factor: number): Vector {
    return new Vector({ w: this.w * factor, h: this.h * factor });
  }

  public get squaredLength(): number {
    return this.w * this.w + this.h * this.h;
  }
  public get length(): number {
    return this.#length();
  }

  public negate(): Vector {
    return new Vector({ w: -this.w, h: -this.h });
  }

  public dot(other: Vector): number {
    return this.w * other.w + this.h * other.h;
  }

  public cross(other: Vector): number {
    return this.w * other.h - this.h * other.w;
  }

  public normalize(): Vector {
    const len = this.length;
    if (len === 0) {
      return new Vector({ w: 0, h: 0 });
    }
    return this.scale(1 / len);
  }

  public project(onto: Vector): Vector {
    const scalar = this.dot(onto) / onto.squaredLength;
    return onto.scale(scalar);
  }

  public perpendicular(): Vector {
    return new Vector({ w: -this.h, h: this.w });
  }

  public sameAs(other: Vector): boolean {
    return nearlyEqual(this.w, other.w) && nearlyEqual(this.h, other.h);
  }
}
