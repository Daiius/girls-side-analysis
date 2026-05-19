import type { NextConfig } from 'next'

// ローカル開発では `/api/auth/*` を server-ts に rewrites で転送し、
// ブラウザから見ると same-origin に見せる（cookie / OAuth state 問題回避）。
// 本番（Vercel）では cross-origin で直接叩き、cookie の domain で共有する。
const apiUrl = process.env.API_URL
const enableAuthRewrites = process.env.ENABLE_AUTH_REWRITES === 'true' && !!apiUrl

const nextConfig = {
  async rewrites() {
    if (!enableAuthRewrites) return []
    return [
      {
        source: '/api/auth/:path*',
        destination: `${apiUrl}/api/auth/:path*`,
      },
    ]
  },
} satisfies NextConfig

export default nextConfig
