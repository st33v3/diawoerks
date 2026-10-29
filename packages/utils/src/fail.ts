export function fail(msg: string = ""): never {
  throw new Error("Failed: " + msg);
}
