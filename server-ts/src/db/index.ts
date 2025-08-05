import { drizzle } from 'drizzle-orm/mysql2'
import { createPool } from 'mysql2'
import * as schema from './schema'

export const connection = createPool({
  host: process.env.DB_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
})

const db = drizzle(connection, { schema, mode: 'default' })

export { db };

