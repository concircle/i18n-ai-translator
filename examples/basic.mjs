import { translateProject } from '../dist/index.mjs';

const result = await translateProject({
  inputPath: './test/fixtures/i18n.properties',
  languages: ['de'],
  dryRun: true,
});

console.log(JSON.stringify(result, null, 2));
