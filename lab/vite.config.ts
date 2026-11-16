import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the built lab opens from any folder or static host.
export default defineConfig({
  // The repository snapshot (about 370 KB of JSON) ships in the main chunk on purpose: the lab works offline.
  build: { chunkSizeWarningLimit: 900 },
  base: './',
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'] },
} as never);
