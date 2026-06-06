// MySQL Prisma Client — uses schema_mysql.prisma
// To activate: npx prisma generate --schema=prisma/schema_mysql.prisma
// Ensure DATABASE_URL_MYSQL is set in .env

import { PrismaClient } from '@prisma/client'

const globalForPrismaMySQL = globalThis as unknown as {
  prismaMySQL: PrismaClient | undefined
}

export const dbMySQL =
  globalForPrismaMySQL.prismaMySQL ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrismaMySQL.prismaMySQL = dbMySQL
