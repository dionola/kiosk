import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

function createPrismaClient() {
    const databaseUrl = process.env.DATABASE_URL

    if (databaseUrl?.startsWith('libsql://')) {
        return new PrismaClient({
            adapter: new PrismaLibSQL({
                url: databaseUrl,
                authToken: process.env.TURSO_AUTH_TOKEN,
            }),
        })
    }

    return new PrismaClient()
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { createPrismaClient }
