import { Bot, webhookCallback } from "grammy";
import { Keyboard } from "grammy";
import { InlineKeyboard } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");

const bot = new Bot(token);

// --- Команды бота ---
bot.command("menu", (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("Кнопка 1", "btn1")
    .text("Кнопка 2", "btn2");
  
  ctx.reply("Выбери кнопку:", { reply_markup: keyboard });
});

// Обработка нажатий
bot.callbackQuery("btn1", (ctx) => ctx.answerCallbackQuery({ text: "Нажата кнопка 1" }));
bot.callbackQuery("btn2", (ctx) => ctx.answerCallbackQuery({ text: "Нажата кнопка 2" }));

bot.command("keyboard", (ctx) => {
  const keyboard = new Keyboard()
    .text("Привет")
    .text("Пока")
    .resized();
  
  ctx.reply("Выбери:", { reply_markup: keyboard });
});
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
