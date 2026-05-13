/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
  },
};

module.exports = nextConfig;