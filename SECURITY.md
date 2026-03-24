# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in @concircle/i18n-ai-translator, please email security concerns to the project maintainers instead of using the public issue tracker.

### Guidelines
1. **Do not** publicly disclose the vulnerability until a fix is available
2. Provide detailed information about the vulnerability including:
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)
3. Allow reasonable time for the maintainers to respond and develop a fix

## Security Considerations

### API Key Management
- **Never commit API keys** (OpenAI, etc.) to version control
- Use environment variables (`.env` files)
- Consider using a secrets management service in production
- Rotate API keys regularly

### Translation Data Privacy
- Ensure compliance with data privacy regulations when translating sensitive content
- Be aware that translations are sent to the AI provider (OpenAI by default)
- Review the AI provider's data handling and privacy policies
- Consider on-premises or private deployment options if needed

### Glossary Files
- Store glossary files securely
- Do not include sensitive information in glossary content
- Version control glossaries carefully to avoid exposing domain-specific data

## Dependency Security
- This package regularly updates dependencies to include security patches
- Run `npm audit` to check for vulnerabilities in your environment
- Report dependency vulnerabilities through npm's security reporting system

## Supported Versions
- Only the latest version receives security updates
- Beta versions (0.x.x) should be treated as experimental

## Contact
For security concerns, please contact the project maintainers directly.
