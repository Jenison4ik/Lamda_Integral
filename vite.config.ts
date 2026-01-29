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
          // React и React-DOM в отдельные чанки
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            if (id.includes("react-dom")) {
              return "vendor-react-dom";
            }
            return "vendor-react";
          }

          // KaTeX (LaTeX рендеринг) - используется только в MathBlock
          if (id.includes("node_modules/katex")) {
            return "vendor-katex";
          }

          // OGL (WebGL библиотека) - используется только в DarkVeil
          if (id.includes("node_modules/ogl")) {
            return "vendor-ogl";
          }

          // Иконки в отдельные чанки
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-lucide";
          }
          if (id.includes("node_modules/react-icons")) {
            return "vendor-react-icons";
          }

          // Vercel Speed Insights
          if (id.includes("node_modules/@vercel/speed-insights")) {
            return "vendor-speed-insights";
          }

          // Telegram SDK в отдельный чанк
          if (id.includes("@tma.js")) {
            return "telegram-sdk";
          }

          // Radix UI компоненты отдельно
          if (id.includes("node_modules/@radix-ui")) {
            return "vendor-radix";
          }

          // Tailwind и утилиты
          if (
            id.includes("node_modules/tailwind") ||
            id.includes("node_modules/clsx") ||
            id.includes("node_modules/tailwind-merge") ||
            id.includes("node_modules/class-variance-authority")
          ) {
            return "vendor-tailwind";
          }

          // Админ-панель в отдельный чанк
          if (id.includes("/pages/Admin")) {
            return "admin";
          }

          // NonTg страница в отдельный чанк
          if (id.includes("/pages/NonTg")) {
            return "non-tg";
          }

          // MathBlock компонент (использует katex)
          if (id.includes("/components/MathBlock")) {
            return "math-block";
          }

          // DarkVeil компонент (использует ogl)
          if (id.includes("/components/DarkVeil")) {
            return "dark-veil";
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

          // Остальные node_modules в vendor чанк
          if (id.includes("node_modules")) {
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
