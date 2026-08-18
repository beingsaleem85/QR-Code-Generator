// Test-only stub for the "server-only" package. Next.js's build resolves
// the real package (which throws if ever bundled into client code) via its
// own webpack config; Vitest doesn't know about that special case, so this
// no-op stands in for it here. The real safety guard still applies in the
// actual Next.js build — this only affects the test runner.
export {};
