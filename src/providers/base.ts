import { AIProvider, SupportedProvider, TranslationBatchRequest, TranslationBatchResponse } from '../types.js';

export abstract class BaseAIProvider implements AIProvider {
  abstract getName(): SupportedProvider;
  abstract translateBatch(
    request: TranslationBatchRequest
  ): Promise<TranslationBatchResponse>;
}
