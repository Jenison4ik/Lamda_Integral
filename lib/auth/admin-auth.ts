import * as jwt from "jsonwebtoken";

export const ADMIN_TOKEN_EXPIRES_SECONDS = 60 * 60 * 12; // 12 часов

type AdminTokenPayload = {
  role: "admin";
};

export function signAdminToken(secret: string): {
  token: string;
  expiresIn: number;
} {
  const payload: AdminTokenPayload = { role: "admin" };
  const token = jwt.sign(payload, secret, {
    expiresIn: ADMIN_TOKEN_EXPIRES_SECONDS,
  });

  return { token, expiresIn: ADMIN_TOKEN_EXPIRES_SECONDS };
}

export function verifyAdminToken(
  token: string,
  secret: string,
): AdminTokenPayload {
  const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
  if (!decoded || decoded.role !== "admin") {
    throw new Error("INVALID_TOKEN");
  }
  return { role: "admin" };
}
