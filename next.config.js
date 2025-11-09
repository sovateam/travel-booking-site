/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Enable static exports if needed
  output: 'standalone',
  // Environment variables if needed
  env: {
    CUSTOM_KEY: 'your-value',
  },
}

module.exports = nextConfig