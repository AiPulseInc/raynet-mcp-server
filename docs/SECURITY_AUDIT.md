# Security Audit Report — Raynet MCP Server v0.80.0

**Date:** 2026-02-09
**Auditor:** Security Auditor Agent
**Scope:** Full source code review of `src/`, dependency audit, configuration review

---

## Assets Under Protection

| Asset | Sensitivity | Location |
|-------|------------|----------|
| Raynet CRM credentials (API key, username) | **Critical** | Environment variables |
| MCP Bearer token (`MCP_API_KEY`) | **Critical** | Environment variable |
| CRM data (companies, contacts, deals, leads) | **High** — contains PII | Raynet API responses |
| Session IDs | **Medium** | In-memory `Map` |

## Threat Model

- **Attacker profile:** External actor targeting the HTTP transport, or insider with access to logs/deployment
- **Attack surface:** HTTP endpoints (`/`, `/health`, `/mcp`), environment variables, npm dependencies, log output

---

## Findings & Remediation Status

### CRITICAL

#### 1. ~~Timing-unsafe token comparison~~ — FIXED ✅

**Before:**
```typescript
if (token !== MCP_API_KEY) {
```

**After:**
```typescript
const tokenBuffer = Buffer.from(token || '');
const keyBuffer = Buffer.from(MCP_API_KEY);
if (tokenBuffer.length !== keyBuffer.length || !timingSafeEqual(tokenBuffer, keyBuffer)) {
```

**File:** `src/server-http.ts:71-74`
**Risk:** String `!==` leaks token length via timing side-channel, enabling character-by-character brute force.
**Fix:** Uses `crypto.timingSafeEqual()` with length pre-check.

---

### HIGH

#### 2. ~~Known dependency vulnerabilities~~ — FIXED ✅

**Before:** 2 vulnerabilities
- `@modelcontextprotocol/sdk 1.10.0-1.25.3` — HIGH: Cross-client data leak via shared transport reuse
- `hono <=4.11.6` — MODERATE: XSS, cache deception, IP spoofing

**After:** `npm audit` reports **0 vulnerabilities**.

**Fix:** `npm audit fix` applied, dependencies updated.

#### 3. ~~Auth bypass when MCP_API_KEY unset~~ — FIXED ✅

**Before:** If `MCP_API_KEY` was not set, all `/mcp` endpoints were completely open with only a log warning.

**After:**
```typescript
if (!MCP_API_KEY && config.server.nodeEnv === 'production') {
  throw new Error('MCP_API_KEY is required in production mode');
}
```

**File:** `src/server-http.ts:406-410`
**Fix:** Server refuses to start in `production` mode without `MCP_API_KEY`. Development mode still allows unauthenticated access for local testing.

---

### MEDIUM

#### 4. ~~No request body size limit~~ — FIXED ✅

**Before:** `app.use(express.json())` — Express default 100KB, not explicit.

**After:** `app.use(express.json({ limit: '1mb' }))` — Explicit 1MB cap.

**File:** `src/server-http.ts:247`
**Risk:** Oversized payloads could cause memory exhaustion.

#### 5. ~~Unbounded session map~~ — FIXED ✅

**Before:** No cap on session count. Attacker could flood `initialize` requests.

**After:** `MAX_SESSIONS = 1000` — New sessions rejected when cap is reached.

**File:** `src/server-http.ts:123,310,330`
**Risk:** Memory exhaustion via session flooding.

#### 6. ~~PII logged at info level~~ — FIXED ✅

**Before:** Tool arguments (containing names, emails, phone numbers) logged at `info` level.

**After:** Tool name logged at `info`, arguments logged at `debug` only.

**Files:** `src/server.ts:59-60`, `src/server-http.ts:173-174,294-298`
**Risk:** PII exposure in production log aggregators.

#### 7. ~~CORS allows all origins~~ — FIXED ✅

**Before:** Hardcoded `Access-Control-Allow-Origin: *`.

**After:**
```typescript
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
res.header('Access-Control-Allow-Origin', CORS_ORIGIN);
```

**File:** `src/server-http.ts:28,258`
**Fix:** CORS origin is now configurable via `CORS_ORIGIN` env var. Defaults to `*` for backward compatibility. Set to a specific origin in production (e.g. `https://your-n8n-instance.com`).

---

### LOW

#### 8. ~~No security headers (Helmet)~~ — FIXED ✅

**Before:** No security headers set.

**After:**
```typescript
import helmet from 'helmet';
app.use(helmet());
```

**File:** `src/server-http.ts:15,251`
**Fix:** `helmet` middleware added. Now sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`, `X-XSS-Protection`, and other security headers automatically.

#### 9. ~~Error messages reflect user input~~ — FIXED ✅

**Before:** `message: \`Method not found: ${method}\``

**After:** `message: 'Method not found'`

**File:** `src/server-http.ts:221`
**Fix:** Error messages no longer reflect user-supplied input. Method name is still logged server-side at `warn` level for debugging.

---

### PASSED ✅

| Check | Status | Notes |
|-------|--------|-------|
| `.env` not in git history | ✅ Pass | Never committed |
| `.gitignore` covers secrets | ✅ Pass | `.env`, `.env.local`, `.env.*.local` |
| No code injection vectors | ✅ Pass | No `eval()`, `Function()`, `child_process`, `exec()` |
| Input validation | ✅ Pass | All tool inputs validated via Zod schemas before API calls |
| Log redaction | ✅ Pass | Sensitive keys (`apiKey`, `password`, `token`, `authorization`) auto-redacted |
| API authentication | ✅ Pass | Basic Auth on every Raynet API request |
| Retry logic | ✅ Pass | Exponential backoff with jitter, max retries capped |
| Rate limit tracking | ✅ Pass | In-memory tracking, pre-request check with buffer |
| Credential storage | ✅ Pass | All secrets via environment variables, never hardcoded |

---

## Summary

| Severity | Found | Fixed | Open |
|----------|-------|-------|------|
| **Critical** | 1 | 1 | 0 |
| **High** | 2 | 2 | 0 |
| **Medium** | 4 | 4 | 0 |
| **Low** | 2 | 2 | 0 |
| **Pass** | 9 | — | — |

**Overall posture: Strong.** All findings have been remediated.

---

## Go-Live Readiness Checklist

### Passed

| Check | Status | Notes |
|-------|--------|-------|
| Build (`tsc`) | ✅ Pass | Compiles clean |
| Tests (`vitest`) | ✅ Pass | 7/7 passing |
| Type check (`tsc --noEmit`) | ✅ Pass | No type errors |
| `npm audit` | ✅ Pass | 0 vulnerabilities |
| Security audit | ✅ Pass | 9/9 findings fixed |
| Timing-safe auth | ✅ Pass | `crypto.timingSafeEqual` |
| Helmet security headers | ✅ Pass | Enabled |
| Production auth enforced | ✅ Pass | Blocks startup without `MCP_API_KEY` |
| Body size limit | ✅ Pass | 1MB cap on `express.json()` |
| Session cap | ✅ Pass | Max 1000 sessions |
| PII logging | ✅ Pass | Tool args at `debug` level only |
| CORS configurable | ✅ Pass | `CORS_ORIGIN` env var |
| Secrets in env vars | ✅ Pass | `.env` never committed to git |
| Input validation | ✅ Pass | Zod schemas on all tool inputs |
| Rate limiting | ✅ Pass | Raynet API daily limits tracked |
| Retry logic | ✅ Pass | Exponential backoff with jitter |
| Dockerfile | ✅ Pass | Multi-stage, non-root user, healthcheck |
| LICENSE | ✅ Pass | MIT |
| CHANGELOG | ✅ Pass | v0.80.0 documented |
| README | ✅ Pass | Updated for v0.80.0 |
| Version centralized | ✅ Pass | `src/version.ts` |

### Required Before Go-Live

| # | Item | Risk if skipped | Effort |
|---|------|----------------|--------|
| 1 | **Commit & push all changes** | Lose all security fixes | 2 min |
| 2 | **Rotate Raynet API key** if exposed in chat/logs | Credential compromise | 5 min |
| 3 | **Set `MCP_API_KEY`** in Railway/production env | Open CRM to anyone | 2 min |
| 4 | **Set `CORS_ORIGIN`** to your n8n domain in production | Wildcard CORS in prod | 2 min |
| 5 | **Set `NODE_ENV=production`** in Railway | Auth bypass allowed in dev mode | 1 min |
| 6 | **Verify `/health` endpoint** after deploy | No confirmation it works | 2 min |

### Nice to Have — Post-Launch

| # | Item | Notes |
|---|------|-------|
| 1 | Add test for `getToolDefinitions()` — mobile vs full count | No regression safety on tool filtering |
| 2 | Add `express-rate-limit` on `/mcp` endpoint | Defense-in-depth beyond Raynet API limits |
| 3 | Remove dead `allToolDefinitions` export | Cleanup |
| 4 | Replace `handleTool` if-chain with a `Map` | Cleaner routing |
| 5 | Cache `getToolDefinitions()` result | Minor perf win |
| 6 | Disable `declaration`/`sourceMap` for prod builds | Smaller build output |
| 7 | Enable `exactOptionalPropertyTypes` in `tsconfig.json` | Stricter type safety |
