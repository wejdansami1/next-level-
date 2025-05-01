import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // mode === 'development' && componentTagger(),
  ].filter(Boolean), // Keep .filter(Boolean) as it handles the array cleanly, even if only react() is left for now
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));