/**
 * AI Provider Types and Interfaces
 * Defines common interfaces for all AI providers
 */

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
}

export interface AIProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface AIProvider {
  name: string;
  generateContent(request: AIRequest): Promise<AIResponse>;
  isConfigured(): boolean;
}

export type ProviderType =
  | 'gemini'
  | 'openai'
  | 'anthropic'
  | 'openrouter'
  | 'ollama'
  | 'lmstudio';

export interface ProviderRegistry {
  [key: string]: new (config: AIProviderConfig) => AIProvider;
}
