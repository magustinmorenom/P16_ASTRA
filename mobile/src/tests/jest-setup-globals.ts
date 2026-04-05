// Polyfills needed before expo runtime loads

// structuredClone polyfill — expo tries to lazily require @ungap/structured-clone
// which fails in jest with "import outside scope" error
if (typeof globalThis.structuredClone === "undefined") {
  globalThis.structuredClone = <T>(value: T): T =>
    JSON.parse(JSON.stringify(value));
}

// __ExpoImportMetaRegistry polyfill
if (typeof (globalThis as Record<string, unknown>).__ExpoImportMetaRegistry === "undefined") {
  Object.defineProperty(globalThis, "__ExpoImportMetaRegistry", {
    value: new Map(),
    writable: true,
    configurable: true,
  });
}
