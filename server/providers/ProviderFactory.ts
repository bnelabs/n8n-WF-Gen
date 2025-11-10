/**
 * AI Provider Factory
 * Creates and configures AI providers based on environment configuration
 */

import { AIProvider, AIProviderConfig, ProviderType } from './types';
import { GeminiProvider } from './GeminiProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { OpenRouterProvider } from './OpenRouterProvider';
import { OllamaProvider } from './OllamaProvider';
import { LMStudioProvider } from './LMStudioProvider';

interface ProviderConfigurations {
  gemini: AIProviderConfig;
  openai: AIProviderConfig;
  anthropic: AIProviderConfig;
  openrouter: AIProviderConfig;
  ollama: AIProviderConfig;
  lmstudio: AIProviderConfig;
}

export class ProviderFactory {
  private static configurations: ProviderConfigurations;

  /**
   * Initialize the factory with configurations from environment variables
   */
  static initialize(): void {
    this.configurations = {
      gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-04-17',
        temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.2'),
        maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '4096'),
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.2'),
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096'),
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.2'),
        maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096'),
      },
      openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY,
        baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-4-turbo-preview',
        temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE || '0.2'),
        maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS || '4096'),
      },
      ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'llama2',
        temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.2'),
        maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS || '4096'),
        timeout: parseInt(process.env.OLLAMA_TIMEOUT || '120000'),
      },
      lmstudio: {
        baseUrl: process.env.LMSTUDIO_BASE_URL || 'http://localhost:1234/v1',
        model: process.env.LMSTUDIO_MODEL || 'local-model',
        temperature: parseFloat(process.env.LMSTUDIO_TEMPERATURE || '0.2'),
        maxTokens: parseInt(process.env.LMSTUDIO_MAX_TOKENS || '4096'),
      },
    };
  }

  /**
   * Create an AI provider instance based on the provider type
   */
  static createProvider(providerType?: ProviderType): AIProvider {
    if (!this.configurations) {
      this.initialize();
    }

    // Default to gemini if not specified
    const type = providerType || (process.env.AI_PROVIDER as ProviderType) || 'gemini';

    let provider: AIProvider;

    switch (type) {
      case 'gemini':
        provider = new GeminiProvider(this.configurations.gemini);
        break;
      case 'openai':
        provider = new OpenAIProvider(this.configurations.openai);
        break;
      case 'anthropic':
        provider = new AnthropicProvider(this.configurations.anthropic);
        break;
      case 'openrouter':
        provider = new OpenRouterProvider(this.configurations.openrouter);
        break;
      case 'ollama':
        provider = new OllamaProvider(this.configurations.ollama);
        break;
      case 'lmstudio':
        provider = new LMStudioProvider(this.configurations.lmstudio);
        break;
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }

    if (!provider.isConfigured()) {
      throw new Error(
        `${provider.name} provider is not configured. Please check your environment variables.`
      );
    }

    return provider;
  }

  /**
   * Get list of all configured providers
   */
  static getConfiguredProviders(): ProviderType[] {
    if (!this.configurations) {
      this.initialize();
    }

    const configured: ProviderType[] = [];

    if (process.env.GEMINI_API_KEY) configured.push('gemini');
    if (process.env.OPENAI_API_KEY) configured.push('openai');
    if (process.env.ANTHROPIC_API_KEY) configured.push('anthropic');
    if (process.env.OPENROUTER_API_KEY) configured.push('openrouter');
    if (process.env.OLLAMA_MODEL) configured.push('ollama');
    if (process.env.LMSTUDIO_MODEL) configured.push('lmstudio');

    return configured;
  }

  /**
   * Check if a specific provider is configured
   */
  static isProviderConfigured(providerType: ProviderType): boolean {
    return this.getConfiguredProviders().includes(providerType);
  }
}
