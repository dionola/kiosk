/** @type {import('next').NextConfig} */
const nextConfig = {
    outputFileTracingRoot: __dirname,
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
