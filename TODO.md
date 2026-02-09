# TODO — Raynet MCP Server

## High Priority

- [ ] **Add tests for `getToolDefinitions()`** — Verify that mobile mode returns exactly 25 tools and full mode returns 91. Currently no test coverage for tool filtering logic.
- [ ] **Remove dead `allToolDefinitions` export** — After switching both servers to `getToolDefinitions()`, the `allToolDefinitions` constant in `src/tools/index.ts` is unused. Remove or mark `@deprecated`.

## Medium Priority

- [ ] **Replace substring-based `handleTool` router with a map** — The current router in `src/tools/index.ts` uses `toolName.includes('compan')`, `toolName.includes('contact')`, etc. This is fragile if future tool names contain overlapping substrings. A `Map<string, handler>` registry would be safer and faster.
- [ ] **Gate startup `console.log` behind environment** — `src/server-http.ts` lines 10-12 have early debug logs (`[STARTUP] ...`) that run unconditionally. Gate behind `NODE_ENV !== 'production'`.
- [ ] **Automate version sync** — `src/version.ts` and `package.json` both hold the version and can drift. Consider a `prebuild` script that reads version from `package.json` and writes `src/version.ts`, or import `package.json` directly.

## Low Priority

- [ ] **Unify `require()` and `import` in `src/tools/index.ts`** — The file uses ES `import` for re-exports but `require()` for building `fullToolDefinitions`. Works fine with `"type": "commonjs"` but is inconsistent.
- [ ] **Add integration tests** — Current test suite (7 tests) only covers config loading. No integration tests for actual API calls or tool handler routing.
- [ ] **Consider additional tool modes** — e.g. `manager` (reports + pipeline), `support` (contacts + activities only). The `mobileToolNames` pattern makes this easy to extend.
- [ ] **Update README tool count** — README header still says "91 MCP tools". Consider making this dynamic or noting "up to 91 tools" with mobile mode offering 25.
