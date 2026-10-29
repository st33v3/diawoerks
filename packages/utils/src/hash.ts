export const hash: unique symbol = Symbol("hash");

const noHash = {
  [hash]: NaN,
};

export function setNoHash<T extends object>(obj: T) {
  Object.assign(obj, noHash);
}

export function setHash(obj: object, h: number) {
  Object.defineProperty(obj, hash, {
    value: h,
    writable: true,
    enumerable: false,
    configurable: false,
  });
}

export function getHash(obj: object): number {
  const h = (obj as { [hash]: unknown })[hash];
  if (typeof h !== "number") throw new Error("No storage for hash found");
  return h;
}
