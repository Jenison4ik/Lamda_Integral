import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Bot, webhookCallback } from "grammy";

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is not set");
}
const bot = new Bot(token);

bot.command("start", async (ctx) => {
  await ctx.reply(
    `
👋 Привет!

Я — бот-тренажёр по интегралам 📐  
Здесь ты можешь потренироваться решать интегралы разной сложности и проверить свои знания.

🚀 Как это работает:
• Выбираешь уровень сложности
• Решaешь несколько случайных задач
• Выбираешь правильный ответ
• В конце получаешь результат и статистику

📊 Доступные уровни:
• Простой — базовые интегралы
• Средний — чуть больше логики
• Сложный — для тех, кто хочет челлендж 🔥

Нажми кнопку ниже и начнём!
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
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Webhook route for Telegram bot
// Используем секретный путь для безопасности
const webhookPath = `/webhook/${token}`;
app.use(webhookPath, webhookCallback(bot, "express"));

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

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  
  // Устанавливаем webhook для Telegram бота
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("⚠️  WEBHOOK_URL не установлен. Webhook не будет настроен автоматически.");
    console.warn("   Установите переменную окружения WEBHOOK_URL с полным HTTPS URL вашего сервера.");
    console.warn(`   Пример: https://your-domain.com${webhookPath}`);
  } else {
    try {
      await bot.api.setWebhook(`${webhookUrl}${webhookPath}`);
      console.log(`✅ Webhook установлен: ${webhookUrl}${webhookPath}`);
    } catch (error) {
      console.error("❌ Ошибка при установке webhook:", error);
    }
  }
});

export default app;
