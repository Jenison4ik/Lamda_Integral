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
bot.callbackQuery("btn2", (ctx) => ctx.reply("Нажата кнопка 2"));

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
Это бот-тренажёр по интегралам 📐 
Здесь ты можешь потренироваться решать интегралы разной сложности и проверить свои знания. 

🚀 Как это работает: 
• Выбираешь уровень сложности
• Решaешь несколько случайных задач 
• Выбираешь правильный ответ
• В конце получаешь результат и статистику

📊 Доступные уровни: 
• Простой — базовые интегралы 
• Средний — чуть больше логики 
• Сложный — для тех, кто хочет челлендж 

🔥 Нажми кнопку ниже и начнём!
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
