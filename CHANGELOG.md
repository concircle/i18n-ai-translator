# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-beta.1] - 2026-03-24

### Added
- Initial beta release of @concircle/i18n-ai-translator
- OpenAI-powered translation for UI5 i18n.properties files
- Placeholder preservation ({0}, {name}, %s, ${var}, etc.)
- Glossary/Vocabulary support for domain-specific terms (e.g., SAP context)
- Optional caching system with TTL and glossary hash invalidation
- Batch-parallelized translation requests (up to 10 parallel)
- Extensible AI Provider architecture for future support (Claude, Gemini, etc.)
- Dual-output: CJS (.cjs) and ESM (.mjs) with TypeScript declarations
- Comprehensive test suite with placeholder preservation tests
- Full npm publishing support with quality gates

### Documentation
- README.md with installation and quick start guide
- API documentation and configuration reference
- Contributing guidelines for community contributions
- Security policy for responsible disclosure
