import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getLatestVotes,
  getVotesRelatedToOshi,
  getLatestVotesForAnalysis,
  getLatestVotesForAnalysisAll,
  getTimelineData,
} from './votes'

// count 同点時の順序ブレを抑えるため、characterName で正規化してから snapshot を取る。
const byName = <T extends { characterName: string }>(rows: T[]) =>
  [...rows].sort((a, b) => a.characterName.localeCompare(b.characterName))

// addTestData.ts の seed（決定的）に対する現状ロジックの出力を凍結する。
// リファクタ後にこの snapshot と突き合わせて挙動変化を検出する。
describe('votes.ts（現状ロジックの baseline snapshot）', () => {
  describe('getLatestVotes', () => {
    it('testID の最新投票', async () => {
      expect(byName(await getLatestVotes('testID'))).toMatchSnapshot()
    })
    it('testID2 の最新投票', async () => {
      expect(byName(await getLatestVotes('testID2'))).toMatchSnapshot()
    })
    it('testID3 の最新投票', async () => {
      expect(byName(await getLatestVotes('testID3'))).toMatchSnapshot()
    })
  })

  describe('getVotesRelatedToOshi', () => {
    it('柊夜ノ介', async () => {
      expect(byName(await getVotesRelatedToOshi('柊夜ノ介'))).toMatchSnapshot()
    })
    it('氷上格', async () => {
      expect(byName(await getVotesRelatedToOshi('氷上格'))).toMatchSnapshot()
    })
    it('紺野玉緒', async () => {
      expect(byName(await getVotesRelatedToOshi('紺野玉緒'))).toMatchSnapshot()
    })
  })

  describe('getLatestVotesForAnalysis', () => {
    it('柊夜ノ介', async () => {
      expect(await getLatestVotesForAnalysis('柊夜ノ介')).toMatchSnapshot()
    })
  })

  describe('getLatestVotesForAnalysisAll', () => {
    it('全キャラ集計', async () => {
      expect(await getLatestVotesForAnalysisAll()).toMatchSnapshot()
    })
  })

  describe('getTimelineData', () => {
    beforeEach(() => {
      // seed は 2023-2024 のデータ。30 日窓に入るよう「今」を固定する。
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-05T12:00:00+09:00'))
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('柊夜ノ介（30日）', async () => {
      expect(await getTimelineData('柊夜ノ介')).toMatchSnapshot()
    })
  })
})
