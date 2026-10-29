const epsilon = 1e-10;

export function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < epsilon;
}
