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

import { prisma } from '../prisma.js';
import { CreateUserInput, UserDto } from '../types/user.types.js';
import { UniqueConstraintError, isPrismaUniqueConstraintError } from '../errors/app.errors.js';

/**
 * Преобразует User из Prisma в DTO для API
 */
function toUserDto(user: {
  id: number;
  telegramId: bigint;
  username: string | null;
  lastSeen: Date | null;
  createdAt: Date;
}): UserDto {
  return {
    id: user.id,
    telegramId: user.telegramId.toString(),
    username: user.username,
    lastSeen: user.lastSeen?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

/**
 * Создаёт нового пользователя
 * @throws {UniqueConstraintError} если пользователь с таким telegramId уже существует
 */
async function create(input: CreateUserInput): Promise<UserDto> {
  const telegramId = input.telegramId != null
    ? BigInt(input.telegramId)
    : BigInt(Date.now());

  const username = typeof input.username === 'string' 
    ? input.username 
    : null;

  try {
    const user = await prisma.user.create({
      data: { telegramId, username },
    });

    return toUserDto(user);
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new UniqueConstraintError('telegramId', 'Пользователь с таким telegramId уже есть');
    }
    throw error;
  }
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
  getById,
  getByTelegramId,
};

