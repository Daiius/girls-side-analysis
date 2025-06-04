import { db } from '@/db';
import { characters } from '@/db/schema';
import { asc } from 'drizzle-orm';

/**
 * キャラデータの一覧を取得します
 */
export const getCharacters = async () => await db.select()
  .from(characters)
  .orderBy(
    asc(characters.series),
    asc(characters.sort), 
  );

