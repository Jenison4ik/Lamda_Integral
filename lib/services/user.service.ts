/**
 * Сервис для работы с пользователями
 *
 * Ответственность:
 * - Работа с Prisma
 * - Бизнес-правила
 * - Транзакции
 *
 * ❌ НЕ знает, что такое HTTP (Request, Response)
 */

import { prisma } from "../prisma.js";
import {
  CreateUserInput,
  UserDto,
  TelegramLoginUserInput,
} from "../types/user.types.js";
import {
  UniqueConstraintError,
  ValidationError,
  isPrismaUniqueConstraintError,
} from "../errors/app.errors.js";

/**
 * Преобразует User из Prisma в DTO для API
 */
function toUserDto(user: {
  id: number;
  telegramId: bigint;
  username: string | null;
  firstName?: string | null;
  lastSeen: Date | null;
  createdAt: Date;
}): UserDto {
  return {
    id: user.id,
    telegramId: user.telegramId.toString(),
    username: user.username,
    firstName: user.firstName ?? null,
    lastSeen: user.lastSeen?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

/**
 * Создаёт нового пользователя
 * @throws {UniqueConstraintError} если пользователь с таким telegramId уже существует
 */
async function create(input: CreateUserInput): Promise<UserDto> {
  if (input.telegramId == null || input.telegramId === "") {
    throw new ValidationError("telegramId обязателен");
  }

  const telegramId = BigInt(input.telegramId);

  const username =
    typeof input.username === "string" && input.username.trim() !== ""
      ? input.username.trim()
      : null;
  const firstName =
    typeof input.firstName === "string" && input.firstName.trim() !== ""
      ? input.firstName.trim()
      : null;

  try {
    const user = await prisma.user.upsert({
      where: { telegramId: telegramId },
      update: {
        lastSeen: new Date(),
        ...(username !== null && { username }),
        ...(firstName !== null && { firstName }),
      },
      create: {
        telegramId: telegramId,
        username: username,
        firstName: firstName,
        lastSeen: new Date(),
        createdAt: new Date(),
      },
    });

    return toUserDto(user);
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new UniqueConstraintError(
        "telegramId",
        "Пользователь с таким telegramId уже есть",
      );
    }
    throw error;
  }
}

/**
 * Находит или создаёт пользователя по данным Telegram Login (native).
 * Используется для POST /auth/telegram-login.
 */
async function upsertFromTelegramLogin(
  input: TelegramLoginUserInput,
): Promise<UserDto> {
  const username =
    typeof input.username === "string" && input.username.trim() !== ""
      ? input.username.trim()
      : null;
  const firstName =
    typeof input.firstName === "string" && input.firstName.trim() !== ""
      ? input.firstName.trim()
      : null;

  const user = await prisma.user.upsert({
    where: { telegramId: input.telegramId },
    update: {
      username: username ?? undefined,
      firstName: firstName ?? undefined,
      lastSeen: new Date(),
    },
    create: {
      telegramId: input.telegramId,
      username: username,
      firstName: firstName,
      lastSeen: new Date(),
      createdAt: new Date(),
    },
  });

  return toUserDto(user);
}

/**
 * Получает пользователя по ID
 */
async function getById(id: number): Promise<UserDto | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  return user ? toUserDto(user) : null;
}

/**
 * Получает пользователя по telegramId
 */
async function getByTelegramId(telegramId: bigint): Promise<UserDto | null> {
  const user = await prisma.user.findUnique({
    where: { telegramId },
  });

  return user ? toUserDto(user) : null;
}

/**
 * Экспортируем сервис как объект с методами
 * Это позволяет легко мокать в тестах
 */
export const userService = {
  create,
  upsertFromTelegramLogin,
  getById,
  getByTelegramId,
};
