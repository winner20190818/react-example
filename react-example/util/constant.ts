function isDevMode() {
  return (
    (typeof __DEV__ === "undefined" ? false : __DEV__) ||
    import.meta?.env?.DEV ||
    process.env.NODE_ENV === "development"
  );
}

export const commonConstant = {
  get isDevMode() {
    return isDevMode();
  },
};
