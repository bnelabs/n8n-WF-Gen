/**
 * Anthropic Claude Provider
 * Implements the AI provider interface for Anthropic's Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider } from './BaseAIProvider';
import { AIRequest, AIResponse, AIProviderConfig } from './types';

export class AnthropicProvider extends BaseAIProvider {
  public name = 'Anthropic';
  private client: Anthropic | null = null;

  constructor(config: AIProviderConfig) {
    super(config);
    if (this.isConfigured()) {
      this.client = new Anthropic({
        apiKey: config.apiKey!,
      });
    }
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async generateContent(request: AIRequest): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('Anthropic provider is not configured. Please provide ANTHROPIC_API_KEY.');
    }

    try {
      const messages: Anthropic.MessageParam[] = request.messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      }));

      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.getMaxTokens(request.maxTokens),
        temperature: this.getTemperature(request.temperature),
        system: request.systemPrompt || undefined,
        messages,
      });

      const content = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      const usage = {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      };

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
