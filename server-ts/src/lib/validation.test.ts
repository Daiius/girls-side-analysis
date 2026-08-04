import { describe, expect, it } from 'vitest'

import {
  findUnknownCharacterNames,
  findUnknownSeries,
  findUnknownStates,
  userStatesInputSchema,
  votesInputSchema,
} from './validation'

// 投票 API の入力検証（prd/04-voting.md §4）。
// 形の検証（zod）はスキーマ単体で、マスタ照合は実 MySQL に対して確かめる。

describe('推しの入力検証（prd/04-voting.md §4）', () => {
  const ok = { characterName: '葉月珪', level: 0 }

  it('推しが 0 人の投票は受け付けない', () => {
    expect(votesInputSchema.safeParse([]).success).toBe(false)
  })

  it('同じキャラを 2 回指定した投票は受け付けない', () => {
    // Votes の PK (twitter_id, voted_date, character_name) に衝突するため。
    const result = votesInputSchema.safeParse([
      { characterName: '葉月珪', level: 0 },
      { characterName: '葉月珪', level: 1 },
    ])
    expect(result.success).toBe(false)
  })

  it('別のキャラが同じ順位でも受け付ける（同順位を将来許すため）', () => {
    // level の連番性は検証しない（prd/01-domain.md §2.1）。
    const result = votesInputSchema.safeParse([
      { characterName: '葉月珪', level: 0 },
      { characterName: '佐伯瑛', level: 0 },
    ])
    expect(result.success).toBe(true)
  })

  it('level が飛び番でも受け付ける', () => {
    expect(votesInputSchema.safeParse([{ ...ok, level: 7 }]).success).toBe(true)
  })

  it.each([
    ['負の値', -1],
    ['tinyint unsigned の上限超え', 256],
    ['整数でない値', 1.5],
  ])('level が%s（%s）の投票は受け付けない', (_label, level) => {
    expect(votesInputSchema.safeParse([{ ...ok, level }]).success).toBe(false)
  })

  it.each([
    ['下限', 0],
    ['上限', 255],
  ])('level が値域の%s（%s）は受け付ける', (_label, level) => {
    expect(votesInputSchema.safeParse([{ ...ok, level }]).success).toBe(true)
  })
})

describe('プレイ状態の入力検証（prd/04-voting.md §3.1・§4）', () => {
  it('一部のシリーズだけの申告を受け付ける（4 件揃っていることを要求しない）', () => {
    const result = userStatesInputSchema.safeParse([
      { series: 2, state: 'プレイ済み' },
    ])
    expect(result.success).toBe(true)
  })

  it.each([
    ['負の値', -1],
    ['tinyint unsigned の上限超え', 256],
    ['整数でない値', 1.5],
  ])('series が%s（%s）の申告は受け付けない', (_label, series) => {
    const result = userStatesInputSchema.safeParse([
      { series, state: 'プレイ済み' },
    ])
    expect(result.success).toBe(false)
  })
})

describe('マスタ照合（prd/04-voting.md §4.2）', () => {
  it('存在しないキャラ名だけを返す', async () => {
    const unknown = await findUnknownCharacterNames(['葉月珪', '存在しない人'])
    expect(unknown).toEqual(['存在しない人'])
  })

  it('全て存在するキャラ名なら空を返す', async () => {
    expect(await findUnknownCharacterNames(['葉月珪'])).toEqual([])
  })

  it('未知の series だけを返す（既知の series はキャラ名簿から導出する）', async () => {
    // GS1〜GS4 は必ず名簿にあり、99 はどの世代にも存在しない。
    // series 番号をコードに焼き込んでいないことの確認でもある。
    const unknown = await findUnknownSeries([1, 2, 3, 4, 99])
    expect(unknown).toEqual([99])
  })

  it('未知のプレイ状態だけを返す', async () => {
    const unknown = await findUnknownStates(['プレイ済み', '未知の状態'])
    expect(unknown).toEqual(['未知の状態'])
  })

  it('同じ未知の値を複数渡しても 1 つに畳む', async () => {
    const unknown = await findUnknownCharacterNames(['存在しない人', '存在しない人'])
    expect(unknown).toEqual(['存在しない人'])
  })
})
