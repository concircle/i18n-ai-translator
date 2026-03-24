import { Translator } from '../dist/index.mjs';

async function main() {
  const translator = new Translator({
    sourceLanguage: 'en',
    targetLanguages: ['de'],
    translationMode: 'missing',
    provider: 'openai',
    providerOptions: {
      apiKey: process.env.OPENAI_API_KEY || 'sk-test',
      model: 'gpt-4.1-mini',
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
          context: 'SAP Enterprise Resource Planning',
        },
        {
          source: 'HANA',
          target: 'SAP HANA',
          doNotTranslate: true,
          context: 'In-memory database',
        },
        {
          source: 'Fiori',
          target: 'SAP Fiori',
          doNotTranslate: true,
          context: 'UX design system',
        },
      ],
      languages: {
        de: [
          {
            source: 'module',
            target: 'Modul',
            context: 'German translation in SAP context',
          },
        ],
      },
    },
    rules: ['Prefer SAP standard wording.'],
    cache: { enabled: true },
    verbose: true,
  });

  console.log(JSON.stringify(translator.getGlossaryTerms('de'), null, 2));

  const result = await translator.translateFile({
    dryRun: true,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error('Glossary example failed:', error);
  process.exit(1);
});
