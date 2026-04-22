/** @type {import('next').NextConfig} */
const nextConfig = {
    outputFileTracingRoot: __dirname,
    images: {
        domains: ['localhost'],
    },
    serverExternalPackages: ['@prisma/adapter-libsql', '@libsql/client', 'libsql'],
    webpack: (config) => {
        config.module.rules.push({
            test: /(\.md$|\.d\.ts$|LICENSE$)/,
            type: 'asset/source',
        })

        return config
    },
}

module.exports = nextConfig
