
import { db } from '../db'
import {
  characters
} from '../db/schema'

/**
 * キャラデータの一覧を取得します
 */
export const getCharacters = async () => 
  await db.query.characters.findMany({
    orderBy: [characters.series, characters.sort]
  })

