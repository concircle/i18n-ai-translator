import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenAIProvider } from '../../src/providers/openai/client';

const createMock = vi.fn();

vi.mock('openai', () => ({
  default: vi.fn(() => ({
    responses: {
      create: createMock,
    },
  })),
}));

describe('OpenAIProvider', () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it('requires an api key', () => {
    expect(() => new OpenAIProvider({})).toThrow('OpenAI API key is required');
  });

  it('calls Responses API with structured output', async () => {
    createMock.mockResolvedValue({
      output_text: JSON.stringify({
        items: [{ key: 'app.title', translatedValue: 'Meine Anwendung' }],
      }),
    });

    const provider = new OpenAIProvider({
      apiKey: 'test-key',
      model: 'gpt-4.1-mini',
    });

    const response = await provider.translateBatch({
      sourceLanguage: 'en',
      targetLanguage: 'de',
      glossaryTerms: [{ source: 'Order', target: 'Auftrag' }],
      rules: ['Use SAP terminology'],
      items: [
        {
          key: 'app.title',
          sourceValue: 'My Application',
          maskedValue: 'My Application',
          placeholders: [],
        },
      ],
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(response.items).toEqual([
      { key: 'app.title', translatedValue: 'Meine Anwendung' },
    ]);
  });

  it('fails on invalid structured output', async () => {
    createMock.mockResolvedValue({
      output_text: JSON.stringify({ invalid: true }),
    });

    const provider = new OpenAIProvider({ apiKey: 'test-key' });

    await expect(
      provider.translateBatch({
        sourceLanguage: 'en',
        targetLanguage: 'de',
        glossaryTerms: [],
        rules: [],
        items: [
          {
            key: 'app.title',
            sourceValue: 'My Application',
            maskedValue: 'My Application',
            placeholders: [],
          },
        ],
      })
    ).rejects.toThrow('items array');
  });
});
