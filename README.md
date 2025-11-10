# n8n Advanced Workflow Generator

An intelligent AI-powered tool that generates n8n workflows from natural language descriptions. Built with React, TypeScript, and powered by Google's Gemini AI.

## ✨ Features

- 🤖 **AI-Powered Generation**: Describe your workflow in plain English, get production-ready n8n JSON
- 🔒 **Secure Architecture**: API keys stored server-side with rate limiting and request validation
- 🐳 **Docker Support**: Run with or without Docker - your choice
- 🧪 **Tested & Validated**: Comprehensive validation with automatic error fixing
- 📊 **Progress Tracking**: Real-time generation progress with step-by-step feedback
- 💾 **Easy Export**: Download workflows as properly formatted JSON files
- 🎨 **Error Boundaries**: Graceful error handling with user-friendly recovery options

## 🚀 Quick Start

### Run with Docker (Recommended)

**Prerequisites:** Docker and Docker Compose

1. **Clone and configure:**
   ```bash
   git clone <repository-url>
   cd n8n-WF-Gen
   cp .env.example .env
   ```

2. **Add your Gemini API key to `.env`:**
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
   Get your API key from: https://makersuite.google.com/app/apikey

3. **Run in development mode (with hot-reload):**
   ```bash
   docker-compose --profile dev up
   ```
   Open http://localhost:5173

4. **Or run in production mode:**
   ```bash
   docker-compose --profile prod up -d
   ```
   Open http://localhost:8080

#### Docker Commands

```bash
# Stop the application
docker-compose --profile dev down    # for dev
docker-compose --profile prod down   # for prod

# Rebuild after changes
docker-compose --profile dev build
docker-compose --profile prod build

# View logs
docker-compose --profile dev logs -f
docker-compose --profile prod logs -f
```

### Run Locally (Without Docker)

**Prerequisites:** Node.js 18+

1. **Install dependencies:**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

2. **Configure environment:**
   ```bash
   # Frontend .env
   cp .env.example .env

   # Backend server/.env
   cd server
   cp .env.example .env
   # Edit server/.env and add your GEMINI_API_KEY
   ```

3. **Run all services:**
   ```bash
   npm run dev:all
   ```
   Open http://localhost:5173

   **Or run services separately:**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev

   # Terminal 2 - Frontend
   npm run dev
   ```

## 🔧 Environment Variables

### Frontend (`.env`)
```bash
API_BASE_URL=http://localhost:3001  # Backend API URL
```

### Backend (`server/.env`)
```bash
GEMINI_API_KEY=your_api_key_here              # REQUIRED
GEMINI_MODEL_NAME=gemini-2.5-flash-preview-04-17
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## 🏗️ Architecture

**Secure Backend Architecture:**
```
Client (React) → Express Backend → Gemini API
                      ↓
                  Rate Limiting (20 req/min)
                  Response Caching
                  Input Validation
```

**Key Security Features:**
- ✅ API keys secured server-side (never exposed to client)
- ✅ Rate limiting prevents abuse
- ✅ Input validation and sanitization
- ✅ Request/response caching reduces API costs
- ✅ Error boundaries prevent app crashes

## 📦 Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Vitest for testing

**Backend:**
- Express.js
- Google Gemini AI
- Rate limiting & CORS middleware

**Infrastructure:**
- Docker & Docker Compose
- Multi-stage builds for production
- Health checks and volume mounting

## 🎯 Key Improvements

This project includes several production-ready improvements:

1. **Security**: API keys protected server-side with rate limiting
2. **Testing**: Unit tests for critical validation logic
3. **UX**: Progress indicators, better error messages, download functionality
4. **Performance**: Response caching, multi-stage Docker builds
5. **Reliability**: Error boundaries, type safety, comprehensive validation

## 📝 Usage

1. Enter a natural language description of your desired workflow
2. Watch the progress as the AI generates your workflow
3. Review the generated n8n workflow JSON
4. Download or copy the JSON to import into n8n


