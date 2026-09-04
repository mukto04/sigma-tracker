/** @type {import("next").NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === 'edge') {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
      };
      config.resolve.alias = {
        ...config.resolve.alias,
        'crypto': 'node:crypto',
        'stream': 'node:stream',
        'net': 'node:net',
        'tls': 'node:tls',
        'fs': 'node:fs',
      };
    }
    return config;
  }
};
export default nextConfig;
