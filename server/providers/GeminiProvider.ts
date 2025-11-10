/**
 * Google Gemini AI Provider
 * Implements the AI provider interface for Google's Gemini API
 */

import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { BaseAIProvider } from './BaseAIProvider';
import { AIRequest, AIResponse, AIProviderConfig } from './types';

export class GeminiProvider extends BaseAIProvider {
  public name = 'Gemini';
  private client: GoogleGenAI | null = null;

  constructor(config: AIProviderConfig) {
    super(config);
    if (this.isConfigured()) {
      this.client = new GoogleGenAI({ apiKey: config.apiKey! });
    }
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async generateContent(request: AIRequest): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('Gemini provider is not configured. Please provide GEMINI_API_KEY.');
    }

    try {
      // Construct the full prompt from messages
      const fullPrompt = this.buildPrompt(request);

      const response: GenerateContentResponse = await this.client.models.generateContent({
        model: this.config.model,
        contents: fullPrompt,
        config: {
          systemInstruction: request.systemPrompt || '',
          responseMimeType: 'application/json',
          temperature: this.getTemperature(request.temperature),
          topP: 0.9,
          topK: 32,
        }
      });

      const content = (response.text || '').trim();

      // Extract usage information if available
      const usage = response.usageMetadata ? {
        inputTokens: response.usageMetadata.promptTokenCount || 0,
        outputTokens: response.usageMetadata.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata.totalTokenCount || 0,
      } : undefined;

      return {
        content,
        usage,
        model: this.config.model,
        provider: this.name,
      };
    } catch (error: any) {
      this.handleError(error, 'generateContent');
    }
  }

  private buildPrompt(request: AIRequest): string {
    // For Gemini, we concatenate messages into a single prompt
    const userMessages = request.messages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join('\n\n');

    return userMessages;
  }
}
