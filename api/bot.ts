import { Bot, webhookCallback } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");

const bot = new Bot(token);

// --- Команды бота ---
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

// Можно добавить другие команды здесь
// bot.command("help", async (ctx) => { ... });

// Экспортируем webhook callback для Vercel
export default webhookCallback(bot, "https");
