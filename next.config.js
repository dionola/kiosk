/** @type {import('next').NextConfig} */
const nextConfig = {
    outputFileTracingRoot: __dirname,
    env: {
        DATABASE_URL: process.env.DATABASE_URL,
        TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
            },
        ],
    },
    serverExternalPackages: ['@prisma/adapter-libsql', '@libsql/client', 'libsql'],
}

module.exports = nextConfig
