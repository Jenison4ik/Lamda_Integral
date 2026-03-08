/**
 * Базовый URL API для редиректов (Telegram Login callback и т.д.).
 * В Vercel: VERCEL_URL без протокола; в проде задайте PUBLIC_API_URL.
 */
export function getApiBaseUrl(requestHost?: string): string {
  const fromEnv = process.env.PUBLIC_API_URL ?? process.env.VERCEL_URL;
  if (fromEnv) {
    const base = fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`;
    return base.replace(/\/$/, "");
  }
  if (requestHost) {
    const proto = process.env.NODE_ENV === "production" ? "https" : "http";
    return `${proto}://${requestHost}`;
  }
  return "http://localhost:3000";
}
