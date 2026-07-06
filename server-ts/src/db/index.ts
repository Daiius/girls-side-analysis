import { drizzle } from 'drizzle-orm/mysql2'
import { createPool } from 'mysql2'
import { relations } from './relations'

export const client = createPool({
  host: process.env.DB_HOST,
  // 既定は 3306。cloudflared tunnel やローカル検証用 DB を別ポートに立てた時に
  // DB_PORT で差し替えられるようにしておく（未設定なら従来通り 3306）。
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
})

const db = drizzle({ client, relations })

export { db };

