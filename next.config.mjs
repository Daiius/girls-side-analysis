/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/girls-side-analysis',
  assetPrefix: '/girls-side-analysis',
  publicRuntimeConfig: {
    basePath: '/girls-side-analysis',
  },
  webpack: (config) => ({
    ...config,
    optimization: { minimize: false }
  }),
};

export default nextConfig;
