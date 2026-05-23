// 副作用なく next から import するための client 向けエントリポイント。
// app.ts は lib/auth.ts を import しており、これを評価すると better-auth が
// BETTER_AUTH_URL 等を要求する。`export type` は TypeScript の type-only re-export で
// runtime 評価が走らないため、AppType だけを安全に再エクスポートできる。

export { hc } from 'hono/client'
export type { AppType } from './app'
