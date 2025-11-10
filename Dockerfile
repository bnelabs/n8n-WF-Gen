# Frontend build stage
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY package*.json ./

# Install frontend dependencies
RUN npm install

# Copy frontend source files (excluding server)
COPY . .

# Build the frontend application (no API keys needed in frontend build)
RUN npm run build

# Backend build stage
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Copy backend package files
COPY server/package*.json ./

# Install backend dependencies
RUN npm install

# Copy backend source
COPY server/ ./

# Build backend
RUN npm run build

# Production stage - Combined frontend (nginx) and backend (node)
FROM node:20-alpine AS production

# Install nginx
RUN apk add --no-cache nginx

WORKDIR /app

# Copy backend built files and dependencies
COPY --from=backend-builder /app/dist ./server/dist
COPY --from=backend-builder /app/node_modules ./server/node_modules
COPY --from=backend-builder /app/package.json ./server/

# Copy frontend built files
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'nginx' >> /app/start.sh && \
    echo 'cd /app/server && node dist/server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose ports
EXPOSE 80 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

# Run both nginx and backend server
CMD ["/app/start.sh"]

# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Run development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
