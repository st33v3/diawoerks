import type { ValueObject } from "immutable";
import * as Immutable from "immutable";
import type { Tagged } from "./tagged";

export interface DataIntro<TP extends {}> extends ValueObject {
  get<K extends keyof TP & string>(key: K): TP[K];
  set<K extends keyof TP & string>(key: K, value: TP[K]): this;
  fields(): ReadonlyArray<keyof TP>;
  copy(overrides?: Partial<TP>): this;
}

export function isDataIntro(obj: unknown): obj is DataIntro<{}> {
  return typeof obj === "object" && Immutable.isValueObject(obj) && "get" in obj && "set" in obj && "fields" in obj && "copy" in obj;
}

export interface DataCtor<TP extends {}> {
  new (initialProps?: Partial<TP>): Readonly<TP> & DataIntro<TP>;
}

interface TaggedDataIntro<S extends string, TP extends {}> extends DataIntro<TP>, Tagged<S> {}

interface TaggedDataCtor<S extends string, TP extends {}> {
  new (initialProps?: Partial<TP>): Readonly<TP> & TaggedDataIntro<S, TP>;
  readonly fields: ReadonlyArray<keyof TP>;
}

function fields<TP extends {}>(template: TP): ReadonlyArray<keyof TP & string> {
  const fs = Object.keys(template);
  Object.freeze(fs);
  return fs as never;
}

function computeHashCode(fields: ReadonlyArray<string>): Function {
  const hashSteps = fields
    .map((field) => `h = ((31 * h + Immutable.hash(this.${field})) | 0);`)
    .join("\n    ");
  const body = `
    let h = 0;
    ${hashSteps}
    return h;
    `;
  return new Function("Immutable", body);
}

function computeEquals(fields: ReadonlyArray<string>): Function {
  const eqSteps = fields
    .map((field) => `if (!Immutable.is(this.${field}, other.${field})) return false;`)
    .join("\n    ");
  const body = `
        if (this === other) return true;
        if (typeof other !== "object" || other === null) return false;
        if (this.constructor !== other.constructor) return false;
        ${eqSteps}
        return true;
        `;
  return new Function("other", "Immutable", body);
}

function computeConstructor(fields: ReadonlyArray<string>): Function {
  const body = fields
    .map((field) => `this.${field} = init.${field} ?? template.${field};`)
    .join("\n    ");
  return new Function("init", "template", body);
}

/**
 * ! DO NOT define constructors on subclasses of DataClass
 * @param template
 * @returns
 */
export function DataClass<TP extends {}>(template: TP): DataCtor<TP> {
  const flds = fields(template);
  const eqFn = computeEquals(flds);
  const hashFn = computeHashCode(flds);
  const ctorFn = computeConstructor(flds);

  const ctor = class implements DataIntro<TP> {
    #hc: number = NaN;
    constructor(initialProps: Partial<TP> = {}) {
      ctorFn.call(this, initialProps, template);
      //previously Object.assign(this, template, initialProps); was very slow
      Object.freeze(this);
    }
    get<K extends keyof TP & string>(key: K): TP[K] {
      return (this as unknown as TP)[key];
    }
    set<K extends keyof TP & string>(key: K, value: TP[K]): this {
      return this.copy({ [key]: value } as never);
    }
    fields(): readonly (keyof TP & string)[] {
      return flds;
    }
    copy(overrides?: Partial<TP> | undefined): this {
      return new (this.constructor as DataCtor<TP>)(Object.assign({}, this, overrides)) as never;
    }
    equals(other: unknown): boolean {
      return eqFn.call(this, other, Immutable);
    }
    hashCode(): number {
      if (isNaN(this.#hc)) this.#hc = hashFn.call(this, Immutable);
      return this.#hc;
    }
  };
  Object.defineProperty(ctor, "fields", {
    value: flds,
    writable: false,
    enumerable: true,
  });
  return ctor as never;
}

export function DataSubClass<TP extends {}, S>(
  sub: abstract new () => S,
  template: TP,
): abstract new (init: TP) => S & TP {
  throw new Error("DataSubClass is not implemented.");
}

// abstract class X {
//     constructor() {
//         console.log("X constructor");
//     }
//     hu() {
//         console.log("hu");
//     }
//     abstract abs(): void;

// }

// class Y extends DataSubClass(X, { a:1 }) {
//     abs(): void {
//         console.log("abs");
//     }
// }

// const y = new Y({ a: 3 });
// y.hu();