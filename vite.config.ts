import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        // Only expose the backend API URL to the client
        'process.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL || 'http://localhost:3001')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        proxy: {
          // Proxy API requests to backend in development
          '/api': {
            target: env.API_BASE_URL || 'http://localhost:3001',
            changeOrigin: true,
          }
        }
      }
    };
});
