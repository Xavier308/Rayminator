// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Aseguramos que los archivos .glb se manejen correctamente
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  // Esta configuración es opcional, pero útil si necesitas ajustar cómo se sirven los archivos estáticos
  resolve: {
    alias: {
      '@': '/src',  // Esto permite importar desde '@/components/...' etc.
    }
  }
});
