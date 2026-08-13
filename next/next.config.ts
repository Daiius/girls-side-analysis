import type { NextConfig } from 'next'

// ローカル開発では `/api/auth/*` を server-ts に rewrites で転送し、
// ブラウザから見ると same-origin に見せる（cookie / OAuth state 問題回避）。
// 本番では cross-origin で直接叩き、cookie の domain で共有する。
const apiUrl = process.env.API_URL
const enableAuthRewrites = process.env.ENABLE_AUTH_REWRITES === 'true' && !!apiUrl

// リモート dev 公開（`pnpm dev:remote`）で前段プロキシ越しに開くときのホスト名。
// dev サーバは /_next/* と /__nextjs*（HMR の WebSocket を含む）への
// クロスオリジン要求を既定で 403 にするため、公開ホストを明示的に許可する。
// localhost / **.localhost は Next 側で常に許可されているので、ローカル dev では空でよい。
// ⚠️ allowedDevOrigins が受け取るのは **オリジンではなくホスト名**（Origin / Referer の
// hostname と突き合わせる実装）。URL をそのまま渡しても一致しない。
const publicOrigin = process.env.PUBLIC_ORIGIN
const allowedDevOrigins = publicOrigin
  ? [new URL(publicOrigin).hostname]
  : []

const nextConfig = {
  allowedDevOrigins,
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
