/** @type {import("next").NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      os: 'os-browserify/browser',
      path: 'path-browserify',
      util: 'util/',
      net: false,
      tls: false,
      fs: false,
      child_process: false,
    };
    return config;
  }
};
export default nextConfig;
