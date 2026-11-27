import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
const host = env?.TAURI_DEV_HOST;
const tauriPlatform = env?.TAURI_ENV_PLATFORM;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_"],
  // Relative asset paths when packaged inside the Tauri webview.
  base: tauriPlatform ? "./" : "/",
  server: {
    host: host || "127.0.0.1",
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
