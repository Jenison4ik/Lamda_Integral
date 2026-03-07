/**
 * Типы для админской авторизации (platform-agnostic)
 */

import type { UserDto } from "./user.types.js";

export interface AdminLoginInput {
  password?: string;
}

export interface AdminLoginResult {
  ok: true;
  token: string;
  expiresIn: number;
}

export interface AdminLoginError {
  ok: false;
  error: string;
}

export interface AdminVerifyResult {
  ok: true;
}

export interface AdminVerifyError {
  ok: false;
  error: string;
}

export interface TelegramAuthInput {
  initData?: string;
}

export interface TelegramAuthResult {
  ok: true;
  user: UserDto;
}

export interface TelegramAuthError {
  ok: false;
  error: string;
}

/** Payload для POST /auth/telegram-login (Telegram Login Widget, native) */
export interface TelegramLoginInput {
  id: number;
  first_name: string;
  username?: string;
  auth_date: number;
  hash: string;
}

export interface TelegramLoginResult {
  token: string;
}

export interface TelegramLoginError {
  ok: false;
  error: string;
}
