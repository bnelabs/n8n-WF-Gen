/**
 * Backend API Server
 * Proxies requests to Gemini API to protect API key
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI, GenerateContentResponse as GeminiGenerateContentResponse } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting - 20 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple in-memory cache for AI responses
interface CacheEntry {
  response: any;
  timestamp: number;
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds
const MAX_CACHE_SIZE = 100;

// Cache cleanup function
function cleanupCache() {
  const now = Date.now();
  const entries = Array.from(responseCache.entries());

  // Remove expired entries
  for (const [key, entry] of entries) {
    if (now - entry.timestamp > CACHE_TTL) {
      responseCache.delete(key);
    }
  }

  // If still too large, remove oldest entries
  if (responseCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = responseCache.size - MAX_CACHE_SIZE;
    for (let i = 0; i < toRemove; i++) {
      responseCache.delete(sortedEntries[i][0]);
    }
  }
}

// Run cache cleanup every 5 minutes
setInterval(cleanupCache, 300000);

// Generate cache key from description
function getCacheKey(description: string): string {
  // Normalize the description for caching
  return description.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Generate workflow endpoint
app.post('/api/generate-workflow', async (req: Request, res: Response) => {
  try {
    const { description, systemInstruction, useCache = true } = req.body;

    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        error: 'Invalid request: description is required and must be a string'
      });
    }

    if (description.length > 5000) {
      return res.status(400).json({
        error: 'Description too long. Please limit to 5000 characters.'
      });
    }

    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set');
      return res.status(500).json({
        error: 'Server configuration error: API key not configured'
      });
    }

    // Check cache
    const cacheKey = getCacheKey(description);
    if (useCache && responseCache.has(cacheKey)) {
      const cached = responseCache.get(cacheKey)!;
      const age = Date.now() - cached.timestamp;

      if (age < CACHE_TTL) {
        console.log(`Cache hit for description (age: ${Math.round(age / 1000)}s)`);
        return res.json({
          ...cached.response,
          cached: true,
          cacheAge: age,
        });
      } else {
        // Remove expired entry
        responseCache.delete(cacheKey);
      }
    }

    // Call Gemini API
    console.log('Calling Gemini API for workflow generation...');
    const ai = new GoogleGenAI({ apiKey });

    const fullPrompt = `User's workflow description:\n${description}\n\nn8n Workflow JSON:`;

    const response: GeminiGenerateContentResponse = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash-preview-04-17',
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction || '',
        responseMimeType: 'application/json',
        temperature: 0.2,
        topP: 0.9,
        topK: 32,
      }
    });

    let jsonStr = response.text.trim();

    // Remove Markdown fences if present
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    // Parse and validate JSON
    let parsedData;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      return res.status(500).json({
        error: 'AI returned invalid JSON. Please try again or rephrase your description.',
        details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      });
    }

    // Basic validation
    if (!parsedData.nodes || !parsedData.connections) {
      return res.status(500).json({
        error: 'Generated workflow is missing essential properties (nodes or connections)'
      });
    }

    const result = { workflow: parsedData };

    // Cache the result
    if (useCache) {
      responseCache.set(cacheKey, {
        response: result,
        timestamp: Date.now(),
      });
      console.log(`Cached response (cache size: ${responseCache.size})`);
    }

    res.json(result);

  } catch (error) {
    console.error('Error generating workflow:', error);

    if (error instanceof Error) {
      // Check for specific Gemini API errors
      if (error.message.includes('400') || error.message.includes('API key')) {
        return res.status(401).json({
          error: 'Invalid API configuration. Please contact support.'
        });
      }

      if (error.message.includes('quota') || error.message.includes('429')) {
        return res.status(429).json({
          error: 'API quota exceeded. Please try again later.'
        });
      }

      return res.status(500).json({
        error: 'Failed to generate workflow. Please try again.',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'An unknown error occurred. Please try again.'
    });
  }
});

// Clear cache endpoint (for development/admin)
app.post('/api/clear-cache', (req: Request, res: Response) => {
  const cleared = responseCache.size;
  responseCache.clear();
  res.json({ message: `Cleared ${cleared} cached entries` });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📊 Rate limit: 20 requests/minute per IP`);
  console.log(`💾 Cache enabled with ${CACHE_TTL / 60000} minute TTL`);
  console.log(`🔑 API Key configured: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
});

export default app;
