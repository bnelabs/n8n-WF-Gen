# n8n Advanced Workflow Generator

This contains everything you need to run your app locally - either with Node.js directly or using Docker.

## Run with Docker (Recommended)

**Prerequisites:** Docker and Docker Compose

Docker allows you to run the application without installing Node.js or any dependencies on your machine.

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd n8n-WF-Gen
   ```

2. **Set up your API key:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
   Get your API key from: https://makersuite.google.com/app/apikey

3. **Run in development mode (with hot-reload):**
   ```bash
   docker-compose --profile dev up
   ```
   The app will be available at: http://localhost:5173

4. **Or run in production mode:**
   ```bash
   docker-compose --profile prod up -d
   ```
   The app will be available at: http://localhost:8080

### Docker Commands

**Stop the application:**
```bash
docker-compose --profile dev down    # for dev mode
docker-compose --profile prod down   # for prod mode
```

**Rebuild after changes:**
```bash
docker-compose --profile dev build
docker-compose --profile prod build
```

**View logs:**
```bash
docker-compose --profile dev logs -f
docker-compose --profile prod logs -f
```

### Using Docker directly (without docker-compose)

**Development mode:**
```bash
docker build -t n8n-wf-gen:dev --target development .
docker run -p 5173:5173 -v $(pwd):/app -v /app/node_modules -e GEMINI_API_KEY=your_key_here n8n-wf-gen:dev
```

**Production mode:**
```bash
docker build -t n8n-wf-gen:prod --target production --build-arg GEMINI_API_KEY=your_key_here .
docker run -p 8080:80 n8n-wf-gen:prod
```

---

## Run Locally (Without Docker)

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
