import { z } from 'zod/v4'

import { db } from '../db'
import { characters, userStatesMaster } from '../db/schema'

// 投票 API の入力検証。仕様は prd/04-voting.md §4 が正典。
//
// 検証は 2 種類に分かれる:
//   1. 形（型・値域・重複）      → zod スキーマ。zValidator が 400 を返す
//   2. マスタに存在するか         → DB を引く必要があり zod では書けないので、
//      （キャラ名 / series / state）  ハンドラから下の find* を呼んで 400 を返す
//
// 正常系の UI からは 1 も 2 も起きない。API を直接叩けば壊せるが、API キーと
// セッションの両方を持つのは本人だけなので被害は自分のデータに限られる
// （prd/06-auth-and-privacy.md §4）。それでも 5xx ではなく 4xx で弾く。

/**
 * POST /votes/:id のボディ。
 *
 * level の連番性は検証しない。同順位（同じ level を持つ複数キャラ）を
 * 将来許すため（prd/01-domain.md §2.1）。推しキャラ数の上限も設けない。
 */
export const votesInputSchema = z
  .array(
    z.object({
      characterName: z.string(),
      // Votes.level / LatestVotes.level は tinyint unsigned
      level: z.number().int().min(0).max(255),
    }),
  )
  // 推しは 1 人以上でなければならない（prd/04-voting.md §4.1）。
  // 0 件を許すと Votes にその日の行が 1 行も残らず、as-of 集計が前回の投票日を
  // 拾って過去日の集計で推しが復活する。加えて drizzle の values([]) が例外を
  // 投げて 500 になる。ここで 400 として弾く。
  .min(1, '推しは 1 人以上必要です')
  // 同じキャラの重複は Votes の PK (twitter_id, voted_date, character_name) に
  // 衝突して 500 になるため、ここで弾く。
  .refine(
    data => new Set(data.map(d => d.characterName)).size === data.length,
    { message: '同じキャラクターを複数回指定することはできません' },
  )

/**
 * POST /users/:id のボディ。
 *
 * 件数は要求しない。送られてきた series を申告として受け取り、残りは
 * 最新値で補完する部分申告を許すため（prd/04-voting.md §3.1）。
 */
export const userStatesInputSchema = z.array(
  z.object({
    // UserStates.series は tinyint unsigned
    series: z.number().int().min(0).max(255),
    state: z.string(),
  }),
)

/**
 * Characters に存在しないキャラ名を返します（重複は畳む）。
 *
 * 空配列なら全て既知。無検証だと Votes.character_name の FK 違反で 500 になる。
 */
export const findUnknownCharacterNames = async (names: string[]) => {
  const rows = await db.select({ name: characters.name }).from(characters)
  const known = new Set(rows.map(row => row.name))
  return [...new Set(names)].filter(name => !known.has(name))
}

/**
 * Characters に存在しない series を返します（重複は畳む）。
 *
 * series の妥当性はキャラ名簿が正典。series 番号をコードに焼き込まないので、
 * GS5 は prd/appendix-characters.md への追加だけで通るようになる。
 */
export const findUnknownSeries = async (seriesList: number[]) => {
  const rows = await db
    .selectDistinct({ series: characters.series })
    .from(characters)
  const known = new Set(rows.map(row => row.series))
  return [...new Set(seriesList)].filter(series => !known.has(series))
}

/**
 * UserStatesMaster に存在しないプレイ状態を返します（重複は畳む）。
 *
 * 無検証だと UserStates.status の FK 違反で 500 になる。
 */
export const findUnknownStates = async (states: string[]) => {
  const rows = await db
    .select({ state: userStatesMaster.state })
    .from(userStatesMaster)
  const known = new Set(rows.map(row => row.state))
  return [...new Set(states)].filter(state => !known.has(state))
}
