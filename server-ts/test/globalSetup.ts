import { execSync } from 'node:child_process'
import { createConnection } from 'mysql2/promise'

// 開発 DB を汚さないための専用テスト DB。
// root で作成し、アプリユーザに権限付与してから drizzle-kit push + seed を流す。
const host = process.env.DB_HOST
const rootPassword = process.env.MYSQL_ROOT_PASSWORD
const appUser = process.env.MYSQL_USER
const baseDatabase = process.env.MYSQL_DATABASE
const testDatabase = `${baseDatabase}_test`

const requireEnv = () => {
  if (!host || !rootPassword || !appUser || !baseDatabase) {
    throw new Error(
      'test DB env が不足しています（DB_HOST / MYSQL_ROOT_PASSWORD / MYSQL_USER / MYSQL_DATABASE）。'
      + ' ローカルでは server コンテナ内（ルートで pnpm test）、'
      + ' CI では GitHub Actions の mysql service（DB_HOST=127.0.0.1）に対して実行する。',
    )
  }
}

export async function setup() {
  requireEnv()

  const root = await createConnection({
    host,
    user: 'root',
    password: rootPassword,
    multipleStatements: true,
  })
  // 毎回まっさらな状態から作り直して決定性を担保する。
  await root.query(`DROP DATABASE IF EXISTS \`${testDatabase}\`;`)
  await root.query(
    `CREATE DATABASE \`${testDatabase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
  )
  await root.query(
    `GRANT ALL PRIVILEGES ON \`${testDatabase}\`.* TO '${appUser}'@'%';`,
  )
  await root.query('FLUSH PRIVILEGES;')
  await root.end()

  // 子プロセスへ渡す env だけ MYSQL_DATABASE をテスト DB に差し替える。
  // TEST_TWITTER_ID は固定値に上書きし、seed の決定性を担保する
  // （環境ごとの値差・実 ID 混入を避ける）。
  const childEnv = {
    ...process.env,
    MYSQL_DATABASE: testDatabase,
    TEST_TWITTER_ID: 'testID2',
  }

  // スキーマ反映：使い捨てテスト DB なので migrate 履歴は不要。
  // drizzle.config.ts を読む push で schema.ts 全体（better-auth テーブル含む）を一発反映する。
  // 接続は childEnv（MYSQL_DATABASE=テスト DB）から config 経由で解決。
  execSync('pnpm exec drizzle-kit push --force', { env: childEnv, stdio: 'inherit' })

  // 決定的な seed 投入
  execSync('pnpm exec tsx addTestData.ts', { env: childEnv, stdio: 'inherit' })
}

export async function teardown() {
  if (!host || !rootPassword) return
  const root = await createConnection({ host, user: 'root', password: rootPassword })
  await root.query(`DROP DATABASE IF EXISTS \`${testDatabase}\`;`)
  await root.end()
}
