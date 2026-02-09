# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.80.0] - 2026-02-09

### Added
- **Mobile tool mode** (`TOOL_MODE=mobile`): Exposes 25 essential tools for field sales reps instead of the full 91. Default mode is now `mobile`.
- **Centralized version management**: Single source of truth in `src/version.ts`, used by both stdio and HTTP servers.
- `CHANGELOG.md` for tracking releases.

### Changed
- Default `TOOL_MODE` changed from `full` to `mobile`.
- Server info endpoints and MCP protocol responses now use centralized `VERSION` and `APP_NAME` constants.
- `package.json` version updated from `0.1.0` to `0.80.0`.

## [0.1.0] - 2026-01-26

### Added
- Initial release with 91 MCP tools across 10 categories.
- Companies, Contacts, Deals, Activities, Leads, Enums, Products, Offers, Sales Orders, Projects.
- Stdio and HTTP transports.
- Bearer token authentication for HTTP transport.
- Polish language support for tool descriptions and error messages.
- Zod-based configuration validation.
- Winston logging with JSON and pretty formats.
- Rate limiting and retry logic for Raynet API.
