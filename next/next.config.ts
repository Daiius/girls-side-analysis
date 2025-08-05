import type { NextConfig } from 'next';

const nextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['local.test'], 
} satisfies NextConfig;

export default nextConfig;

