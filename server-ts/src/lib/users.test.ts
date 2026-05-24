import { describe, expect, it } from 'vitest'

import { getLatestUserState, getUserStatesMaster } from './users'

// addTestData.ts の seed（決定的）に対する現状ロジックの出力を凍結する。
describe('users.ts（現状ロジックの baseline snapshot）', () => {
  const bySeries = <T extends { series: number }>(rows: T[]) =>
    [...rows].sort((a, b) => a.series - b.series)

  describe('getLatestUserState', () => {
    it('testID の最新状態', async () => {
      expect(bySeries(await getLatestUserState('testID'))).toMatchSnapshot()
    })
    it('testID2 の最新状態', async () => {
      expect(bySeries(await getLatestUserState('testID2'))).toMatchSnapshot()
    })
  })

  describe('getUserStatesMaster', () => {
    it('プレイ状態マスタ', async () => {
      expect(await getUserStatesMaster()).toMatchSnapshot()
    })
  })
})
