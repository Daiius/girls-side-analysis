import type { NextConfig } from 'next';

const nextConfig = {
  basePath: '/girls-side-analysis',
  //assetPrefix: '/girls-side-analysis',
  //publicRuntimeConfig: {
  //  basePath: '/girls-side-analysis',
  //},
  //webpack: (config) => ({
  //  ...config,
  //  optimization: { minimize: false }
  //}),
  output: 'standalone',
  serverExternalPackages: ['mysql2'],
} satisfies NextConfig;

export default nextConfig;

