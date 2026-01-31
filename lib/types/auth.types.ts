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
