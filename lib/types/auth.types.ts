/**
 * Типы для админской авторизации (platform-agnostic)
 */

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
