import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

declare global {
  var _db: ReturnType<typeof drizzle> | undefined;
}


export const connection = await mysql.createConnection({ //mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});


const db = globalThis._db || drizzle(connection);

//if (process.env.NODE_ENV !== 'production') {
  globalThis._db = db;
//}

export { db };

