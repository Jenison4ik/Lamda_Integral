/**
 * Типы для Telegram-бота (platform-agnostic)
 */

import { Context, SessionFlavor } from 'grammy';

/**
 * Данные сессии пользователя
 */
export interface SessionData {
  /** ID текущей квиз-сессии */
  currentQuizSessionId?: number;
  /** Выбранная сложность */
  difficulty?: 'easy' | 'medium' | 'hard';
}

/**
 * Контекст бота с сессией
 */
export type BotContext = Context & SessionFlavor<SessionData>;

/**
 * Конфигурация бота
 */
export interface BotConfig {
  token: string;
  webAppUrl: string;
}

