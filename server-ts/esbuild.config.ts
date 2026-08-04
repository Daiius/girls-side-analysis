import { type BuildOptions, build } from 'esbuild'

const common: BuildOptions = {
  platform: 'node',
  format: 'esm',
  bundle: true,
  target: 'node20',
  resolveExtensions: ['.ts', '.js'],
  external: ['tty'],
  banner: {
    js: `
      import { createRequire } from "module";
      import __url from "url";
      const require = createRequire(import.meta.url);
      const __filename = __url.fileURLToPath(import.meta.url);
      const __dirname = __url.fileURLToPath(new URL(".", import.meta.url));
    `,
  }
}

await Promise.all([
  // API サーバ本体
  build({
    ...common,
    entryPoints: ['./src/index.ts'],
    outfile: './dist/index.js',
  }),
  // マイグレーション。本番イメージに別エントリとして同梱し、使い捨てコンテナで
  // 明示的に実行する（起動時の自動適用にはしない。PRD 03 §5）。
  // ⚠️ drizzle/*/migration.sql は migrator が実行時に fs で読むため
  //    **このバンドルには入らない**。イメージ側で別途 COPY すること。
  build({
    ...common,
    entryPoints: ['./migrate.ts'],
    outfile: './dist/migrate.js',
  }),
])
