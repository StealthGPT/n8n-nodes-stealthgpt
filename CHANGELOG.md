# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-08

### Added

- Initial release of the StealthGPT community node.
- **StealthGPT API** credential (`api-token` header auth, configurable base URL, balance-endpoint connection test).
- **Content Generation** resource: Start Run (academic / SEO / social presets) and Get Run Status.
- **Text Humanization** resource: Start Run (quality mode, model, output format) and Get Run Status.
- Asynchronous run handling with an optional "Wait for Completion" polling loop (configurable poll interval and max wait).
- Optional idempotency key and webhook passthrough on start operations.
- Error mapping for authentication, billing, validation, and rate-limit responses.
