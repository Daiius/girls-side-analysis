import { createAuthClient } from 'better-auth/react'

// ローカル: NEXT_PUBLIC_AUTH_BASE_URL を空にすると相対パス `/api/auth/*` を叩き、
// next.config.ts の rewrites で server-ts に転送される（same-origin）。
// 本番 (Vercel): NEXT_PUBLIC_AUTH_BASE_URL に API サーバの URL を設定し、
// cross-origin で直接叩く（cookie domain で共有）。
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_BASE_URL || '',
})
