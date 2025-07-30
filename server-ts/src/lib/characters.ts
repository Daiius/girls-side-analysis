
import { db } from '../db'

/**
 * キャラデータの一覧を取得します
 */
export const getCharacters = async () => await db.query.characters.findMany()

