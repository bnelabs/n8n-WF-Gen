/**
 * Ollama Provider
 * Implements the AI provider interface for Ollama (local AI models)
 * Supports models like Llama, Mistral, CodeLlama, etc.
 */

import axios from 'axios';
import { BaseAIProvider } from './BaseAIProvider';
import { AIRequest, AIResponse, AIProviderConfig } from './types';

interface OllamaMessage {
  role: string;
  content: string;
}

interface OllamaResponse {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export class OllamaProvider extends BaseAIProvider {
  public name = 'Ollama';
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
  }

  isConfigured(): boolean {
    // Ollama runs locally, so we just need a model name
    return !!this.config.model;
  }

  async generateContent(request: AIRequest): Promise<AIResponse> {
    try {
      const messages: OllamaMessage[] = [];

      // Ollama handles system prompts as a system message
      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt,
        });
      }

      // Add conversation messages
      request.messages.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });

      const response = await axios.post<OllamaResponse>(
        `${this.baseUrl}/api/chat`,
        {
          model: this.config.model,
          messages,
          stream: false,
          options: {
            temperature: this.getTemperature(request.temperature),
            num_predict: this.getMaxTokens(request.maxTokens),
          },
          format: 'json', // Request JSON output
        },
        {
          timeout: this.config.timeout || 120000, // 2 minutes default for local models
        }
      );

      const content = response.data.message.content;

      // Ollama provides token counts
      const usage = response.data.prompt_eval_count || response.data.eval_count ? {
        inputTokens: response.data.prompt_eval_count || 0,
        outputTokens: response.data.eval_count || 0,
        totalTokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0),
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
}
