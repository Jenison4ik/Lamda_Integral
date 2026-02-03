/**
 * Клавиатуры бота (platform-agnostic)
 *
 * Отделены от логики обработчиков
 */

import { InlineKeyboard, Keyboard } from "grammy";
import { BOT_MESSAGES } from "./messages.js";

/**
 * Создаёт inline-клавиатуру для команды /menu
 */
export function createMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(BOT_MESSAGES.menu.button1, "btn1")
    .text(BOT_MESSAGES.menu.button2, "btn2");
}

/**
 * Создаёт reply-клавиатуру для команды /keyboard
 */
export function createReplyKeyboard(): Keyboard {
  return new Keyboard()
    .text(BOT_MESSAGES.keyboard.hello)
    .text(BOT_MESSAGES.keyboard.bye)
    .resized();
}

/**
 * Создаёт inline-клавиатуру с кнопкой Web App
 */
export function createWebAppKeyboard(webAppUrl: string) {
  return {
    inline_keyboard: [
      [
        {
          text: BOT_MESSAGES.buttons.openApp,
          web_app: { url: webAppUrl },
        },
      ],
    ],
  };
}

/**
 * Создаёт inline-клавиатуру для подтверждения EULA
 */
export function createConfirmEulaKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: BOT_MESSAGES.buttons.confirmEula,
          callback_data: "confirm_eula",
        },
      ],
    ],
  };
}
