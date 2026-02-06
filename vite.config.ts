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
        onwarn(warning, warn) {
          // Игнорируем предупреждение об использовании eval в lottie-web
          if (warning.code === "EVAL" && warning.id?.includes("lottie")) {
            return;
          }
          warn(warning);
        },
        output: {
          manualChunks: (id) => {
            // ВАЖНО: Проверяем специфичные библиотеки ПЕРЕД общими проверками
            // чтобы избежать циклических зависимостей

            // React и React-DOM в отдельные чанки (проверяем первыми)
            if (id.includes("node_modules/react-dom")) {
              return "vendor-react-dom";
            }
            if (id.includes("node_modules/react/")) {
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

            // Lottie (анимации) - используется в Emoji компоненте
            if (id.includes("node_modules/lottie")) {
              return "vendor-lottie";
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

            // React Query
            if (id.includes("node_modules/@tanstack/react-query")) {
              return "vendor-react-query";
            }

            // Остальные node_modules в vendor чанк (проверяем после всех специфичных)
            if (id.includes("node_modules")) {
              return "vendor";
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

            // Все UI компоненты в один чанк (убрали разделение на admin-ui и ui-components
            // чтобы избежать циклических зависимостей)
            if (id.includes("/components/ui/")) {
              return "ui-components";
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
