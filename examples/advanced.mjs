import { Translator } from '../dist/index.mjs';

async function main() {
  const translator = new Translator({
    sourceLanguage: 'en',
    targetLanguages: ['de', 'fr'],
    translationMode: 'missing',
    provider: 'openai',
    providerOptions: {
      apiKey: process.env.OPENAI_API_KEY || 'sk-test',
      model: 'gpt-4.1-mini',
      temperature: 0,
    },
    files: {
      input: './test/fixtures/i18n.properties',
      outputDir: './test/fixtures/runtime',
    },
    glossary: {
      shared: [
        {
          source: 'SAP',
          target: 'SAP',
          doNotTranslate: true,
          context: 'SAP product name',
        },
      ],
      languages: {
        de: [
          {
            source: 'Plant',
            target: 'Werk',
            context: 'SAP logistics term',
          },
        ],
      },
    },
    rules: ['Use SAP terminology consistently.'],
    cache: {
      enabled: true,
      ttlMs: 7 * 24 * 60 * 60 * 1000,
    },
    verbose: true,
  });

  const result = await translator.translateFile({
    dryRun: true,
  });

  console.log(JSON.stringify(result, null, 2));
  console.log(JSON.stringify(translator.getCacheStats(), null, 2));
}

main().catch((error) => {
  console.error('Advanced example failed:', error);
  process.exit(1);
});
