import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  // Tauri のビルド用設定を追加！
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: process.env.TAURI_ENV === 'windows' ? 'chrome105' : 'safari13',
    minify: false,
    cssMinify: false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
  optimizeDeps: {
    include: ['@monaco-editor/react', 'lucide-react', 'markdown-it', 'dompurify'],
  },
}));
