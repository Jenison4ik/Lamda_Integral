import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: "client",
  envDir: process.cwd(),
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Админ-панель в отдельный чанк
          if (id.includes("/pages/Admin")) {
            return "admin";
          }
          // NonTg страница в отдельный чанк
          if (id.includes("/pages/NonTg")) {
            return "non-tg";
          }
          // Telegram SDK в отдельный чанк
          if (id.includes("@tma.js")) {
            return "telegram-sdk";
          }
          // UI компоненты админ-панели в отдельный чанк
          if (
            id.includes("/components/ui/table") ||
            id.includes("/components/ui/card") ||
            id.includes("/components/ui/input") ||
            id.includes("/components/ui/label") ||
            id.includes("/components/ui/alert") ||
            id.includes("/components/ui/badge")
          ) {
            return "admin-ui";
          }
          // Остальные UI компоненты
          if (id.includes("/components/ui/")) {
            return "ui-components";
          }
          // node_modules в vendor чанк
          if (id.includes("node_modules")) {
            // Radix UI компоненты отдельно
            if (id.includes("@radix-ui")) {
              return "vendor-radix";
            }
            // Остальные зависимости
            return "vendor";
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
    },
  },
});
