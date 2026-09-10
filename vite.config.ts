import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-ignore — plain JS plugin
import { javaRunnerPlugin } from './server/run-java.mjs';

export default defineConfig({
  plugins: [react(), javaRunnerPlugin()],
  server: {
    port: 5173,
    open: true,
  },
});
