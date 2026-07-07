import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@app": path.resolve(__dirname, "./src/app"),
      "@data": path.resolve(__dirname, "./src/data"),
      "@controllers": path.resolve(__dirname, "./src/controllers"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@ui": path.resolve(__dirname, "./src/ui"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@schema": path.resolve(__dirname, "./src/schema-engine"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
