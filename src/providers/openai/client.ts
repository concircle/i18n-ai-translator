import OpenAI from 'openai';
import { BaseAIProvider } from '../base.js';
import {
  OpenAIProviderOptions,
  TranslationBatchRequest,
  TranslationBatchResponse,
} from '../../types.js';

const TRANSLATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'translatedValue'],
        properties: {
          key: { type: 'string' },
          translatedValue: { type: 'string' },
        },
      },
    },
  },
} satisfies Record<string, unknown>;

export class OpenAIProvider extends BaseAIProvider {
  private readonly client: OpenAI;
  private readonly options: Required<
    Pick<OpenAIProviderOptions, 'model' | 'temperature' | 'maxOutputTokens'>
  > &
    Omit<OpenAIProviderOptions, 'model' | 'temperature' | 'maxOutputTokens'>;

  constructor(options: OpenAIProviderOptions) {
    super();

    if (!options.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseURL,
      organization: options.organization,
    });

    this.options = {
      ...options,
      model: options.model ?? 'gpt-4.1-mini',
      temperature: options.temperature ?? 0,
      maxOutputTokens: options.maxOutputTokens ?? 4000,
    };
  }

  getName(): 'openai' {
    return 'openai';
  }

  async translateBatch(
    request: TranslationBatchRequest
  ): Promise<TranslationBatchResponse> {
    const response = await this.client.responses.create({
      model: request.model ?? this.options.model,
      temperature: this.options.temperature,
      max_output_tokens: this.options.maxOutputTokens,
      text: {
        format: {
          type: 'json_schema',
          name: 'translation_batch',
          schema: TRANSLATION_SCHEMA,
          strict: true,
        },
      },
      input: [
        {
          role: 'system',
          content: buildSystemPrompt(),
        },
        {
          role: 'user',
          content: JSON.stringify(buildPayload(request)),
        },
      ],
    });

    const rawResponse = response.output_text?.trim();
    if (!rawResponse) {
      throw new Error('OpenAI Responses API returned an empty response');
    }

    const parsed = JSON.parse(rawResponse) as {
      items?: Array<{ key?: string; translatedValue?: string }>;
    };

    if (!Array.isArray(parsed.items)) {
      throw new Error('OpenAI response is missing items array');
    }

    return {
      provider: 'openai',
      rawResponse,
      items: parsed.items.map((item) => {
        if (!item.key || typeof item.translatedValue !== 'string') {
          throw new Error('OpenAI response contains an invalid translation item');
        }

        return {
          key: item.key,
          translatedValue: item.translatedValue,
        };
      }),
    };
  }
}

function buildSystemPrompt(): string {
  return [
    'You translate SAP UI5 i18n property values.',
    'Return JSON only.',
    'Translate values, never keys.',
    'Do not add explanations.',
    'Keep placeholder tokens like __I18N_PH_0__ unchanged.',
    'Preserve surrounding punctuation and semantic meaning.',
    'Apply glossary terms strictly when provided.',
  ].join(' ');
}

function buildPayload(request: TranslationBatchRequest): Record<string, unknown> {
  return {
    sourceLanguage: request.sourceLanguage,
    targetLanguage: request.targetLanguage,
    glossaryTerms: request.glossaryTerms,
    rules: request.rules,
    items: request.items.map((item) => ({
      key: item.key,
      value: item.maskedValue,
      placeholders: item.placeholders.map((placeholder) => placeholder.placeholder),
    })),
  };
}
