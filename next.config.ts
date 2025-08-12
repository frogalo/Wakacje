import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
    config: {
        serverExternalPackage: ['@prisma/client', 'prisma']
    }
};

export default nextConfig;