# MCP Best Practices Guide

> Based on "MCP is Not the Problem, It's your Server: Best Practices for Building MCP Servers"

## Overview

MCP (Model Context Protocol) provides a universal connection between LLMs and external tools, data sources, and services. However, most MCP servers fail not because of the protocol, but because developers treat MCP like a REST API wrapper.

**Key Insight:** MCP is a User Interface for AI Agents. Different users require different design principles.

---

## What MCP Is NOT

| Common Mistake | Reality |
|----------------|---------|
| Thin wrapper around REST API | Agent-optimized interface |
| Data dump service | Curated, outcome-oriented responses |
| 1:1 endpoint mapping | High-level task completion tools |

### Why REST API Principles Don't Work for Agents

| Principle | Developers | Agents |
|-----------|------------|--------|
| Discovery | Cheap (read docs once) | Expensive (schema in every request) |
| Composability | Mix and match small endpoints | Multi-step tool calls, slow iteration |
| Flexibility | Many options = more flexibility | Complexity leads to hallucination |

---

## The Six Best Practices

### 1. Outcomes, Not Operations

**Trap:** Converting REST endpoints 1:1 into MCP tools.

**Fix:** Design tools around what the user/agent wants to achieve.

```
❌ Bad: Three separate tools
- get_user_by_email()
- list_orders(user_id)
- get_order_status(order_id)

✅ Good: One outcome-oriented tool
- track_latest_order(email)
```

Do the orchestration in your code, not in the LLM's context window.

---

### 2. Flatten Your Arguments

**Trap:** Using complex nested dictionaries or configuration objects as arguments.

**Fix:** Top-level primitives and constrained types.

```python
# ❌ Bad - Agent guesses structure, hallucinates keys
def search_orders(filters: dict) -> list

# ✅ Good - Clear, typed, constrained
def search_orders(
    email: str,
    status: Literal["pending", "shipped", "delivered"] = "pending",
    limit: int = 10
) -> list
```

Benefits:
- Literal types constrain choices
- Defaults reduce decisions
- No hallucinated keys

---

### 3. Instructions are Context

**Trap:** Empty docstrings, generic error messages.

**Fix:** Every piece of text is part of the agent's context.

#### Docstrings Should Specify:
- **When** to use the tool ("Use when the user asks about order status")
- **How** to format arguments ("Email must be lowercase")
- **What** to expect back ("Returns order ID and current status")

#### Error Messages Are Context Too!
```python
# ❌ Bad
raise Exception("User not found")

# ✅ Good
return "User not found. Please try searching by email address instead."
```

The agent sees errors as observations and uses your instructions to self-correct.

---

### 4. Curate Ruthlessly

**Trap:** Exposing everything your API can do. Returning everything the API returns.

**Fix:** Design for discovery, not exhaustive exposure.

Guidelines:
- **5–15 tools per server** (optimal range)
- **One server, one job**
- **Delete unused tools**
- **Split by persona** (Admin vs User)
- **Build for discovery** - Agent should find the right tool quickly

Every tool description, response payload, and error message competes in the context window.

---

### 5. Name Tools for Discovery

**Trap:** Generic names like `create_issue` or `send_message`.

**Fix:** Service-prefixed, action-oriented names.

**Pattern:** `{service}_{action}_{resource}`

```
✅ Good Examples:
- slack_send_message
- linear_list_issues
- sentry_get_error_details
- raynet_create_company
- raynet_track_deal_status
```

This prevents confusion when multiple MCP servers are loaded (e.g., both GitHub and Jira having `create_issue`).

---

### 6. Paginate Large Results

**Trap:** Returning hundreds of records.

**Fix:** Paginate with metadata.

Requirements:
- Respect a `limit` parameter (default 20–50)
- Return `has_more`, `next_offset`, `total_count`
- Never load all results into memory

```json
{
  "data": [...],
  "totalCount": 150,
  "limit": 20,
  "offset": 0,
  "hasMore": true
}
```

---

## Practical Example: Gmail MCP Server

### Before (API-Wrapper Approach)
```python
# Reading requires 2 tools + understanding nested types
def messages_list(query: str, max_results: int) -> dict: ...
def messages_get(message_id: str, format: str) -> dict: ...

# Sending requires base64-encoding a MIME message
def messages_send(message: {"raw": str}) -> dict: ...
```

**Problems:** Agent must construct `{"raw": base64(...)}` and parse nested structures.

### After (Agent-First Approach)
```python
# Reading: Flat tools with curated returns
def gmail_search(query: str, limit: int = 10) -> list[dict]: ...
def gmail_read(message_id: str) -> dict: ...

# Writing: Simple, flat arguments
def gmail_send(to: list[str], subject: str, body: str) -> dict: ...
```

---

## Skills vs MCP

| Aspect | Skills | MCP |
|--------|--------|-----|
| Structure | Filesystem-based, progressive disclosure | Structured tool interfaces |
| Loading | Metadata at startup, instructions when triggered | All tools loaded upfront |
| Validation | Generic execution (bash) | Parameter validation, typed responses |
| Best For | Teaching workflows, combining tools | Structured service exposure |

**Use both:** MCP servers for structured interfaces, Skills for workflow guidance.

---

## Summary Checklist

When building an MCP Server, you're building an interface for AI agents:

- [ ] **Outcomes over operations** - Design for agent goals, not API structure
- [ ] **Flatten arguments** - Use primitives and enums, not nested objects
- [ ] **Instructions are context** - Docstrings and errors guide the agent
- [ ] **Curate ruthlessly** - 5-15 tools, tight responses
- [ ] **Name for discovery** - Service-prefixed names (`raynet_*`)
- [ ] **Paginate results** - Include metadata for large lists

---

## References

- Block's MCP Playbook
- GitHub's Security Guide
- FastMCP AI Engineering Summit
