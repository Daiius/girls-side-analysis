// 既に稼働している DB を drizzle マイグレーション管理下に載せる一回限りの初期化。
//
// 指定した世代までを「SQL を実行せず適用済みとして記録」する。
// 以降の `pnpm db:migrate` はそれより後の世代だけを流す。
// 適用判定は名前ベースなので記録するのは name で十分
// （hash / created_at も migrator と同じ値で入れておく）。
//
// ⚠️ **どこまで記録するかは既定を持たない。必ず引数で指定する。**
//    drizzle/ は複数世代あり、既存 DB がどこまで進んでいるかはこのスクリプトからは
//    分からない。取り違えると次の migrate が既に適用済みの DDL を流して失敗する
//    （実測: 現行スキーマの DB に最初の 1 本だけ記録 → ALTER ADD `reading` が
//     ER_DUP_FIELDNAME で停止）。**先に DB の実スキーマを確認してから指定すること。**
//
// 冪等: 既に記録済みの世代は飛ばす。
// 新規 DB では不要（db:migrate が最初から順に流す）。
//
// ⚠️ **データ移行（DDL を含まない世代）は、スキーマを見ても適用済みか判断できない。**
//    例: reading の backfill は、カラムが default '' で生えているだけの DB でも
//    「スキーマは現行」に見える。そのまま記録すると backfill が永久に飛ばされる。
//    対象範囲にデータ移行が入るときは --include-data-migrations を要求する。
//
// 実行: pnpm db:baseline <世代名 or その一意な接頭辞>（本番は DDL/INSERT 可能な管理ユーザで）
//   例) reading 追加前の DB … pnpm db:baseline 20260706112547_complex_wild_child
//       データも投入済みの DB … pnpm db:baseline 20260706112653 --include-data-migrations

import { sql } from 'drizzle-orm'
import { readMigrationFiles } from 'drizzle-orm/migrator'

import { db, client } from './src/db'

const MIGRATIONS_TABLE = '__drizzle_migrations'

try {
  const migrations = readMigrationFiles({ migrationsFolder: './drizzle' })
  if (migrations.length === 0) {
    throw new Error(
      'drizzle/ にマイグレーションが 1 つもありません。' +
      'migration.sql の無いフォルダは migrator に無視されます（PRD 03 §5.1）',
    )
  }

  const names = migrations.map(m => m.name)
  const args = process.argv.slice(2)
  const includeData = args.includes('--include-data-migrations')
  const target = args.find(a => !a.startsWith('--'))
  if (!target) {
    throw new Error(
      'どの世代まで適用済みとして記録するかを指定してください。\n' +
      `  usage: pnpm db:baseline <世代名> [--include-data-migrations]\n` +
      `  候補: ${names.join('\n        ')}`,
    )
  }

  const matched = names.includes(target)
    ? [target]
    : names.filter(n => n.startsWith(target))
  if (matched.length !== 1) {
    throw new Error(
      matched.length === 0
        ? `該当する世代がありません: ${target}\n  候補: ${names.join('\n        ')}`
        : `接頭辞が一意ではありません: ${target}\n  該当: ${matched.join(', ')}`,
    )
  }

  // 指定世代までを対象にする（それより後は db:migrate が流す）
  const selected = migrations.slice(0, names.indexOf(matched[0]!) + 1)

  // DDL を含まない世代 = データ移行。スキーマを見ても適用済みか判断できないので、
  // 明示のフラグが無ければ記録を拒否する。⚠️ 判定前にコメント行を落とすこと
  // （backfill の SQL は「0001 の ALTER で〜」と本文に書いてあり、素で見ると DDL 扱いになる）。
  const dataOnly = selected.filter(m => {
    const body = m.sql
      .join('\n')
      .split('\n')
      .filter(line => !line.trimStart().startsWith('--'))
      .join('\n')
    return !/\b(CREATE|ALTER|DROP|RENAME|TRUNCATE)\b/i.test(body)
  })
  if (dataOnly.length > 0 && !includeData) {
    throw new Error(
      '対象範囲にデータ移行（DDL を含まない世代）が入っています:\n' +
      `        ${dataOnly.map(m => m.name).join('\n        ')}\n` +
      'これらはスキーマを見ても適用済みか判断できません。**データ側を確認**してから\n' +
      '--include-data-migrations を付けて再実行してください。\n' +
      '未投入なら、その手前の世代までを記録して db:migrate に流させること。',
    )
  }

  // migrator が使うのと同一スキーマで作成（無ければ）
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ${sql.identifier(MIGRATIONS_TABLE)} (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at BIGINT,
      name TEXT,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  for (const migration of selected) {
    const [rows] = await db.execute(
      sql`SELECT name FROM ${sql.identifier(MIGRATIONS_TABLE)} WHERE name = ${migration.name}`,
    )

    if (Array.isArray(rows) && rows.length > 0) {
      console.log(`already recorded: ${migration.name}（何もしません）`)
    } else {
      await db.execute(sql`
        INSERT INTO ${sql.identifier(MIGRATIONS_TABLE)} (hash, created_at, name)
        VALUES (${migration.hash}, ${migration.folderMillis}, ${migration.name})
      `)
      console.log(`baseline recorded: ${migration.name}（DDL は実行していません）`)
    }
  }
} finally {
  await client.end()
}
