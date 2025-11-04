import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

function createPrismaClient() {
    const databaseUrl = process.env.DATABASE_URL

    if (databaseUrl?.startsWith('libsql://')) {
        const client = createClient({
            url: databaseUrl,
            authToken: process.env.TURSO_AUTH_TOKEN,
        })

        return new PrismaClient({
            adapter: new PrismaLibSQL(client),
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
