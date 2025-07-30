import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod/v4'

import { getCharacters } from './lib/characters'
import { 
  getLatestVotes,
  getLatestVotesForAnalysis, 
  getLatestVotesForAnalysisAll,
  getTimelineData,
  insertVotesIfUpdated,
} from './lib/votes'
import {
  getLatestUserState,
  getUserStatesMaster,
  insertUserStatesIfUpdated,
} from './lib/users'
import type { Vote } from './types'


const apiKey = process.env.API_KEY ??
  (() => { throw new Error('process.env.API_KEY is not defined!') })()

const app = new Hono()

// 単純なAPIキー認証
app.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return c.body(null, 401)
  const tokens = authHeader.split(': ')
  if (tokens.length != 2) return c.body(null, 400)
  const [bearer, apiKeyToken] = tokens
  if (bearer !== 'Bearer') return c.body(null, 400)
  if (apiKeyToken !== apiKey) return c.body(null, 401)
  await next()
})

const route = app
  .get(
    '/characters',  // キャラクター一覧を取得します
    async (c) => {
      const characters = await getCharacters()
      return c.json(characters, 200)
    },
  )
  .get(
    '/analysis/:charaName', // 特定のキャラクターに関連する投票データを取得します
    zValidator('param', z.string()),
    async c => {
      const charaName = c.req.valid('param')
      const data = await getLatestVotesForAnalysis(charaName)
      return c.json(data, 200)
    }
  )
  .get(
    '/analysis', // 全てのキャラクターについて、関連する投票データを取得します
    async c => {
      const data = await getLatestVotesForAnalysisAll()
      return c.json(data, 200)
    },
  )
  .get(
    '/timeline/:charaName', // 特定のキャラについて、関連するキャラの時系列データを取得します
    zValidator('param', z.string()),
    async c => {
      const charaName = c.req.valid('param')
      const data = await getTimelineData(charaName)
      return c.json(data, 200)
    },
  )
  .get(
    '/users/:id', // 特定のユーザの最新の情報を取得します
    zValidator('param', z.string()),
    async c => {
      const id = c.req.valid('param')
      const data = await getLatestUserState(id)
      return c.json(data, 200)
    },
  )
  .get(
    '/meta/users/status-types', // ユーザ状態のパターン一覧を取得します
    async c => {
      const data = await getUserStatesMaster()
      return c.json(data, 200)
    },
  )
  .post(
    '/users/:id', // ユーザ状態に最新状態からの変更があれば更新します
    zValidator('param', z.string()),
    zValidator('json',
      z.array(z.object({
        series: z.number(),
        state: z.string(),
      })),
    ),
    async c => {
      const id = c.req.valid('param')
      const data = c.req.valid('json')
      try {
        await insertUserStatesIfUpdated({
          twitterID: id,
          data,
        })
        return c.body(null, 200)
      } catch (e) {
        if (e instanceof Error) {
          console.error(`exception at POST /users/${id}: ${e.message}`)
        } else {
          console.error(`unknown error at POST /users/${id}`)
        }
        return c.body(null, 500)
      } 
    },
  )
  .get(
    '/votes/:id', // 特定のユーザの最新の投票結果を取得します
    zValidator('param', z.string()),
    async c => {
      const id = c.req.valid('param')
      const data = await getLatestVotes(id)
      return c.json(data, 200)
    },
  )
  .post(
    '/votes/:id',
    zValidator('param', z.string()),
    zValidator('json', z.array(z.object({
      characterName: z.string(),
      level: z.number(),
    }))),
    async c => {
      const id = c.req.valid('param')
      const votes = c.req.valid('json')
      try {
        await insertVotesIfUpdated({ twitterID: id, data: votes })
      } catch (e) {
        if (e instanceof Error) {
          console.error(`exception at POST /votes/${id}: ${e.message}`)
        } else {
          console.error(`unknown error at POST /votes/${id}`)
        }
        return c.body(null, 500)
      }
    },
  )
    
    

export type AppType = typeof route

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
