/**
 * LM Studio Provider
 * Implements the AI provider interface for LM Studio (local AI models)
 * LM Studio provides an OpenAI-compatible API for local models
 */

import OpenAI from 'openai';
import { BaseAIProvider } from './BaseAIProvider';
import { AIRequest, AIResponse, AIProviderConfig } from './types';

export class LMStudioProvider extends BaseAIProvider {
  public name = 'LMStudio';
  private client: OpenAI;

  constructor(config: AIProviderConfig) {
    super(config);
    // LM Studio uses OpenAI-compatible API with local base URL
    this.client = new OpenAI({
      apiKey: 'lm-studio', // LM Studio doesn't require a real API key
      baseURL: config.baseUrl || 'http://localhost:1234/v1',
    });
  }

  isConfigured(): boolean {
    // LM Studio just needs a model name
    return !!this.config.model;
  }

  async generateContent(request: AIRequest): Promise<AIResponse> {
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
