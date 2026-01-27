import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Bot, webhookCallback } from "grammy";

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");

const bot = new Bot(token);

// --- Бот ---
bot.command("start", async (ctx) => {
  await ctx.reply(
    `
👋 Привет!

Я — бот-тренажёр по интегралам 📐
...
🚀 Начнем!
`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🚀 Открыть",
              web_app: {
                url: "https://lamda-integral.vercel.app/",
              },
            },
          ],
        ],
      },
    },
  );
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Webhook path ---
const webhookPath = `/webhook/${token}`;
app.use(webhookPath, webhookCallback(bot, "express"));

// --- Простые роуты ---
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.get("/api/hello", (req: Request, res: Response) => {
  res.json({ message: "Hello from Express backend!" });
});

// --- Ошибки ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// --- Определяем, dev или деплой ---
const isVercel = !!process.env.VERCEL;

if (!isVercel) {
  // --- Локальный дев-сервер ---
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);

    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn(
        "⚠️  WEBHOOK_URL не установлен. Webhook не будет настроен автоматически.",
      );
    } else {
      try {
        await bot.api.setWebhook(`${webhookUrl}${webhookPath}`);
        console.log(`✅ Webhook установлен: ${webhookUrl}${webhookPath}`);
      } catch (error) {
        console.error("❌ Ошибка при установке webhook:", error);
      }
    }
  });
}

// --- Для Vercel Serverless ---
export default async function handler(req: any, res: any) {
  if (isVercel) {
    const callback = webhookCallback(bot, "express");
    return callback(req, res);
  } else {
    res.status(200).send("Running locally on Express");
  }
}
