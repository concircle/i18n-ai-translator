# Contributing to @concircle/i18n-ai-translator

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Development Setup

### Prerequisites
- Node.js 18+ (check with `node --version`)
- npm 9+

### Getting Started
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Run tests:
   ```bash
   npm test
   ```

## Development Workflow

### Running in Development Mode
```bash
npm run dev
```

### Running Tests
```bash
npm test              # Run tests once
npm run test:watch   # Watch mode
npm run test:coverage # With coverage report
```

### Code Quality
```bash
npm run lint          # Check code style
npm run format        # Auto-format code
npm run format:check  # Check formatting without changes
```

### Building for Distribution
```bash
npm run build
```

## Contributing Guidelines

### Before You Start
- Check existing issues to avoid duplicates
- Open an issue/discussion for major features first
- Review the current project roadmap (if available)

### Code Style
- We use TypeScript with strict mode enabled
- ESLint configuration enforces code style
- Prettier is used for automatic formatting
- Run `npm run format` before committing

### Commits
- Use clear, descriptive commit messages
- Reference issue numbers when applicable: "Fix: placeholder preservation (#123)"
- Keep commits focused and atomic

### Testing
- **All new features must include tests**
- **Placeholder preservation is critical** — any code touching `placeholderExtractor.ts` requires comprehensive tests
- Run full test suite before submitting PR: `npm test`
- Aim for reasonable test coverage (at least 80%)

### Pull Requests
1. Create a feature branch from `main`: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Add/update tests and documentation
4. Run: `npm run lint`, `npm run format`, `npm test`
5. Push your branch and create a Pull Request
6. Provide clear description of changes and motivation

### Documentation
- Update README.md if adding public API features
- Add JSDoc comments to public functions and classes
- Update CHANGELOG.md (in unreleased section) with significant changes
- Create/update examples if adding new functionality

## Project Structure
```
src/
  ├── providers/          # AI Provider implementations
  ├── parsers/            # File parsing & placeholder handling
  ├── glossary/           # Glossary management
  ├── cache/              # Caching layer
  ├── utils/              # Utilities (config, logging)
  ├── types.ts            # TypeScript type definitions
  └── index.ts            # Main export
test/
  ├── providers/
  ├── parsers/
  └── fixtures/           # Test data files
examples/                 # Example usage scripts
docs/                     # Additional documentation
```

## Key Areas for Contribution

### High Priority
- **Tests** — Especially placeholder preservation edge cases
- **Documentation** — Examples, API docs, guides
- **Bug fixes** — Issues marked with `bug`

### Future Features (For Later)
- Claude/Gemini provider implementations (see `providers/base.ts` for interface)
- Advanced caching strategies
- CLI tool wrapper
- Performance optimizations

## Code Review Process
- Maintainers will review PRs carefully
- Be responsive to feedback and iteration requests
- All CI checks must pass successfully
- At least one approval required before merge

## Questions?
- Open a discussion on GitHub
- Check existing documentation in `docs/`
- Review examples in `examples/`

Thank you for contributing!
