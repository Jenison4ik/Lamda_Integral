import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Bot } from "grammy";
import { fileURLToPath } from "url";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is not set");
}

dotenv.config();
const bot = new Bot(token);

bot.command("start", async (ctx) => {
  await ctx.reply("Welcome! Up and running.", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🚀 Открыть",
            web_app: {
              url: "https://lambda-integral.vercel.app/",
            },
          },
        ],
      ],
    },
  });
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.get("/api/hello", (req: Request, res: Response) => {
  res.json({ message: "Hello from Express backend!" });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Запуск сервера только если файл запущен напрямую (не импортирован)
// В ES modules используем fileURLToPath для проверки
const isMainModule = (): boolean => {
  if (!import.meta.url.startsWith("file://")) return false;

  try {
    const modulePath = fileURLToPath(import.meta.url);
    const mainPath = process.argv[1];

    if (!mainPath) return false;

    // Нормализуем пути для сравнения (Windows использует обратные слеши)
    const normalizePath = (p: string) => p.replace(/\\/g, "/").toLowerCase();
    const normalizedModule = normalizePath(modulePath);
    const normalizedMain = normalizePath(mainPath);

    return (
      normalizedModule === normalizedMain ||
      normalizedMain.includes("server/index")
    );
  } catch {
    return false;
  }
};

if (isMainModule()) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

export default app;
