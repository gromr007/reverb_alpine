import { defineConfig, loadEnv } from 'vite'

export default defineConfig( ({ mode }) => {
	  
  // Загружаем переменные из .env файлов
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/chat3/',
    cacheDir: 'node_modules/.vite_alpine',
    server: {
        host: '0.0.0.0',
        port: 5183,
        strictPort: true,
        cors: true,
        hmr: {
			host: env.VITE_WS_HOST,
			protocol: env.VITE_WSS_PROTOCOL,
			clientPort: env.VITE_WSS_PORT,
        }
    }
  }
})
