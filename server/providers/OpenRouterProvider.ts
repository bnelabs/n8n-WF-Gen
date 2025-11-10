/**
 * OpenRouter Provider
 * Implements the AI provider interface for OpenRouter's unified API
 * OpenRouter provides access to many AI models through a single API
 */

import OpenAI from 'openai';
import { BaseAIProvider } from './BaseAIProvider';
import { AIRequest, AIResponse, AIProviderConfig } from './types';

export class OpenRouterProvider extends BaseAIProvider {
  public name = 'OpenRouter';
  private client: OpenAI | null = null;

  constructor(config: AIProviderConfig) {
    super(config);
    if (this.isConfigured()) {
      // OpenRouter uses OpenAI-compatible API with custom base URL
      this.client = new OpenAI({
        apiKey: config.apiKey!,
        baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
          'X-Title': 'n8n Workflow Generator',
        },
      });
    }
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async generateContent(request: AIRequest): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('OpenRouter provider is not configured. Please provide OPENROUTER_API_KEY.');
    }

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      // Add system message if provided
      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt,
        });
      }

      // Add conversation messages
      request.messages.forEach(msg => {
        messages.push({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        });
      });

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        temperature: this.getTemperature(request.temperature),
        max_tokens: this.getMaxTokens(request.maxTokens),
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '';

      const usage = response.usage ? {
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined;

      return {
        content,
        usage,
        model: response.model,
        provider: this.name,
      };
    } catch (error: any) {
      this.handleError(error, 'generateContent');
    }
  }
}
