/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['10.238.61.1', 'localhost', '127.0.0.1'],
  experimental: {
    cpus: 2,
  },
};

export default nextConfig;
