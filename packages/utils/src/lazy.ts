export const lazy = <R>(fn: () => R): (() => R) => {
  let cached: R;
  let initialized = false;
  return () => {
    if (!initialized) {
      cached = fn();
      initialized = true;
    }
    return cached;
  };
};
