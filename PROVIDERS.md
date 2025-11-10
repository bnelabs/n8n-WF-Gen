# AI Provider Configuration Guide

The n8n Workflow Generator now supports multiple AI providers, giving you flexibility to choose between cloud services and local models based on your needs.

## Supported Providers

### Cloud Providers

1. **Google Gemini** (Default)
   - Fast and cost-effective
   - Good JSON generation capabilities
   - API Key required

2. **OpenAI**
   - GPT-4 and GPT-3.5 Turbo models
   - Excellent at following complex instructions
   - API Key required

3. **Anthropic Claude**
   - Claude 3.5 Sonnet and other models
   - Strong reasoning capabilities
   - API Key required

4. **OpenRouter**
   - Unified access to many AI models
   - Single API for multiple providers
   - Pay-as-you-go pricing
   - API Key required

### Local Providers

5. **Ollama**
   - Run models locally (Llama, Mistral, CodeLlama, etc.)
   - No API key needed
   - Free but requires local resources

6. **LM Studio**
   - User-friendly local model interface
   - OpenAI-compatible API
   - No API key needed

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Your Provider

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and set your preferred provider:

```bash
AI_PROVIDER=gemini  # or openai, anthropic, openrouter, ollama, lmstudio
```

### 3. Add Provider-Specific Configuration

#### For Google Gemini:
```bash
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash-preview-04-17
```

Get your API key from: https://makersuite.google.com/app/apikey

#### For OpenAI:
```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview
```

Get your API key from: https://platform.openai.com/api-keys

#### For Anthropic Claude:
```bash
ANTHROPIC_API_KEY=your_api_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

Get your API key from: https://console.anthropic.com/

#### For OpenRouter:
```bash
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=openai/gpt-4-turbo-preview
```

Get your API key from: https://openrouter.ai/keys

#### For Ollama (Local):
```bash
# Install Ollama first: https://ollama.ai/
# Pull a model: ollama pull llama2
OLLAMA_MODEL=llama2
OLLAMA_BASE_URL=http://localhost:11434
```

Popular Ollama models:
- `llama2` - Meta's Llama 2 (7B, 13B, 70B)
- `llama3` - Meta's Llama 3 (8B, 70B)
- `mistral` - Mistral AI's models
- `codellama` - Specialized for code generation
- `phi3` - Microsoft's Phi-3 models

#### For LM Studio (Local):
```bash
# Install LM Studio: https://lmstudio.ai/
# Start the local server and load a model
LMSTUDIO_MODEL=local-model
LMSTUDIO_BASE_URL=http://localhost:1234/v1
```

### 4. Start the Server

```bash
npm run dev
```

## Advanced Configuration

### Temperature Control

Temperature controls randomness in the output (0.0 = deterministic, 1.0 = creative):

```bash
GEMINI_TEMPERATURE=0.2
OPENAI_TEMPERATURE=0.2
ANTHROPIC_TEMPERATURE=0.2
```

For workflow generation, we recommend keeping temperature low (0.2-0.4) for more consistent JSON output.

### Token Limits

Control the maximum response length:

```bash
GEMINI_MAX_TOKENS=4096
OPENAI_MAX_TOKENS=4096
ANTHROPIC_MAX_TOKENS=4096
```

### Local Model Configuration

For local models, you can adjust timeout values:

```bash
OLLAMA_TIMEOUT=120000  # 2 minutes
```

## Switching Providers Dynamically

You can switch providers without restarting by sending the provider in the API request:

```javascript
fetch('http://localhost:3001/api/generate-workflow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'Create a workflow that...',
    provider: 'openai'  // Override the default provider
  })
})
```

## Check Available Providers

Query the API to see which providers are configured:

```bash
curl http://localhost:3001/api/providers
```

Response:
```json
{
  "current": "gemini",
  "configured": ["gemini", "openai", "anthropic"],
  "available": ["gemini", "openai", "anthropic", "openrouter", "ollama", "lmstudio"]
}
```

## Cost Comparison

### Cloud Providers (approximate costs per 1M tokens)

| Provider | Input Cost | Output Cost | Speed | Quality |
|----------|-----------|-------------|-------|---------|
| Gemini Flash | $0.075 | $0.30 | Fast | Good |
| GPT-4 Turbo | $10 | $30 | Medium | Excellent |
| Claude 3.5 | $3 | $15 | Medium | Excellent |
| OpenRouter | Varies | Varies | Medium | Varies |

### Local Providers

| Provider | Cost | Speed | Quality |
|----------|------|-------|---------|
| Ollama | Free* | Depends on hardware | Good |
| LM Studio | Free* | Depends on hardware | Good |

*Free to use but requires local computing resources (GPU recommended)

## Troubleshooting

### Provider Not Configured Error

If you see "AI provider not configured", make sure:
1. The provider's API key is set in `.env`
2. For local models, the service is running
3. The model name is correct

### Connection Errors (Local Models)

If you see "Cannot connect to AI provider":

**For Ollama:**
```bash
# Check if Ollama is running
ollama list

# Start Ollama service
ollama serve
```

**For LM Studio:**
1. Open LM Studio
2. Load a model
3. Click "Start Server" in the Local Server tab
4. Verify it's running on port 1234

### API Key Errors

Double-check that:
- Your API key is correct (no extra spaces)
- Your account has sufficient credits/quota
- The API key has the necessary permissions

### JSON Parsing Errors

Some models may need prompt adjustments. If you get JSON parsing errors frequently:
1. Try a different model within the same provider
2. Adjust the temperature (try 0.1 for more deterministic output)
3. Consider switching to a provider better suited for structured output (Gemini, GPT-4)

## Best Practices

1. **Development**: Use Gemini or local models to keep costs low
2. **Production**: Use GPT-4 or Claude for highest quality results
3. **Cost Optimization**: Use OpenRouter to compare multiple models
4. **Privacy**: Use local models (Ollama/LM Studio) for sensitive data
5. **Caching**: The server caches responses for 1 hour to reduce costs

## Adding New Providers

The architecture is designed to be extensible. To add a new provider:

1. Create a new provider class in `server/providers/`
2. Extend `BaseAIProvider`
3. Implement the `generateContent()` method
4. Register it in `ProviderFactory.ts`
5. Add configuration to `.env.example`

See the existing providers for examples.

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Express Server │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│ ProviderFactory │─────▶│ BaseProvider │
└──────┬──────────┘      └──────────────┘
       │
       ├──▶ GeminiProvider
       ├──▶ OpenAIProvider
       ├──▶ AnthropicProvider
       ├──▶ OpenRouterProvider
       ├──▶ OllamaProvider
       └──▶ LMStudioProvider
```

All providers implement the same interface, making them interchangeable without code changes.

## Support

For issues or questions:
- Check the server logs for detailed error messages
- Verify your configuration in `.env`
- Test with the `/api/providers` endpoint
- Consult the provider's documentation for API-specific issues
