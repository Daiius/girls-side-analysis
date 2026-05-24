import { defineConfig } from 'vitest/config'

// 開発 DB を汚さないため、テストは別 database（`<MYSQL_DATABASE>_test`）に対して走らせる。
// globalSetup で root 接続して作成・migrate・seed し、teardown で drop する。
const testDatabase = `${process.env.MYSQL_DATABASE ?? 'app'}_test`

export default defineConfig({
  test: {
    // db シングルトン（src/db/index.ts）が import 時に読む MYSQL_DATABASE を
    // テスト DB に差し替える。
    env: {
      MYSQL_DATABASE: testDatabase,
    },
    globalSetup: ['./test/globalSetup.ts'],
    include: ['src/**/*.test.ts'],
    // 単一 DB を共有するためテスト間の並行実行は無効化する。
    fileParallelism: false,
    sequence: { concurrent: false },
  },
})
