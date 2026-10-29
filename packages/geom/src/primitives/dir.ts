import { Data } from "effect";
import { Vector } from "./vector";

const deg45 = Math.sqrt(2) / 2;

export abstract class Dir extends Data.TaggedClass("Dir")<{ ord: number; x: number; y: number }> {
  #vector = new Vector({ w: this.x, h: this.y });
  /**
   * Returns the unit vector representation of this direction, or (0, 0) for the center direction.
   */
  public get vector() {
    return this.#vector;
  }

  public get major(): boolean {
    return this.x === 1 || this.y === 1;
  }

  public get minor(): boolean {
    return this.x !== 0 && this.y !== 0;
  }

  public abstract get center(): boolean;

  protected abstract rotate(num: number): Dir;

  public toMajor(shift: "cw" | "ccw"): Dir {
    if (this.major) return this;
    return shift === "cw" ? this.cw() : this.ccw();
  }

  public cw(): Dir {
    return this.rotate(1);
  }

  public ccw(): Dir {
    return this.rotate(-1);
  }

  public cw2(): Dir {
    return this.rotate(2);
  }

  public ccw2(): Dir {
    return this.rotate(-2);
  }

  public opposite(): Dir {
    return this.rotate(4);
  }

  public isOpposite(other: Dir): boolean {
    return this.opposite() === other;
  }

  public mirrorX(): Dir {
    return Dir.allDirs.find((d) => d.x === this.x && d.y === -this.y)!;
  }

  public mirrorY(): Dir {
    return Dir.allDirs.find((d) => d.x === -this.x && d.y === this.y)!;
  }

  private static Regular = class extends Dir {
    protected rotate(num: number): Dir {
      return Dir.dirs[(this.ord + num) % Dir.dirs.length];
    }
    public get center(): boolean {
      return false;
    }
  };

  static North: Dir = new Dir.Regular({ ord: 0, x: 0, y: -1 });
  static NorthEast: Dir = new Dir.Regular({ ord: 1, x: deg45, y: -deg45 });
  static East: Dir = new Dir.Regular({ ord: 2, x: 1, y: 0 });
  static SouthEast: Dir = new Dir.Regular({ ord: 3, x: deg45, y: deg45 });
  static South: Dir = new Dir.Regular({ ord: 4, x: 0, y: 1 });
  static SouthWest: Dir = new Dir.Regular({ ord: 5, x: -deg45, y: deg45 });
  static West: Dir = new Dir.Regular({ ord: 6, x: -1, y: 0 });
  static NorthWest: Dir = new Dir.Regular({ ord: 7, x: -deg45, y: -deg45 });
  static Center: Dir = new (class extends Dir {
    protected rotate(num: number): Dir {
      return this;
    }
    public get center(): boolean {
      return true;
    }
  })({ ord: 8, x: 0, y: 0 });

  private static dirs = [
    Dir.North,
    Dir.NorthEast,
    Dir.East,
    Dir.SouthEast,
    Dir.South,
    Dir.SouthWest,
    Dir.West,
    Dir.NorthWest,
  ];
  private static allDirs = [
    Dir.North,
    Dir.NorthEast,
    Dir.East,
    Dir.SouthEast,
    Dir.South,
    Dir.SouthWest,
    Dir.West,
    Dir.NorthWest,
    Dir.Center,
  ];
}
