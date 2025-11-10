/**
 * Base AI Provider
 * Abstract base class with common functionality for all AI providers
 */

import { AIProvider, AIProviderConfig, AIRequest, AIResponse } from './types';

export abstract class BaseAIProvider implements AIProvider {
  protected config: AIProviderConfig;
  public abstract name: string;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.validateConfig();
  }

  abstract generateContent(request: AIRequest): Promise<AIResponse>;

  abstract isConfigured(): boolean;

  protected validateConfig(): void {
    if (!this.config.model) {
      throw new Error(`${this.name}: Model is required in configuration`);
    }
  }

  protected getTemperature(requestTemp?: number): number {
    return requestTemp ?? this.config.temperature ?? 0.7;
  }

  protected getMaxTokens(requestMaxTokens?: number): number {
    return requestMaxTokens ?? this.config.maxTokens ?? 4096;
  }

  protected handleError(error: any, context: string): never {
    console.error(`${this.name} Error [${context}]:`, error);

    if (error.response) {
      throw new Error(
        `${this.name} API Error: ${error.response.status} - ${
          error.response.data?.error?.message || error.response.statusText
        }`
      );
    }

    if (error.code === 'ECONNREFUSED') {
      throw new Error(
        `${this.name} Connection Error: Cannot connect to ${
          this.config.baseUrl || 'API'
        }. Make sure the service is running.`
      );
    }

    throw new Error(`${this.name} Error: ${error.message}`);
  }
}
