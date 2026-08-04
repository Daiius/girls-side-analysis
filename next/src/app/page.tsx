import clsx from 'clsx';

import TopCharacterSelect from '@/components/TopCharacterSelect';
import TopAnalysis from '@/components/TopAnalysis';
import { 
  getLatestVotesForAnalysisAll,
} from '@/lib/votes';
import VoteLink from '@/components/VoteLink';
import XShareLink from '@/components/XShareLink';
import GSMessage from '@/components/GSMessage';

import { debug } from '@/lib/logger'

// 1日1回更新
// On-demand ISRも投票時に行われる
export const revalidate = 86400;

const hostUrl = process.env.HOST_URL 
  ?? (() => { throw new Error(`process.env.HOST_URL is null`) })();

export default async function Home() {

  debug('rendering... /')

  debug('retrieving analysis data...')
  const data = await getLatestVotesForAnalysisAll();
  debug('done! %O', data)

  // trailing slashまで付けるとopenGraphImageが表示されるのを確認
  // TODO 本当？確認する
  const text = 'GSシリーズの情報共有・分析サイト';
  const sharedURL = `${hostUrl}`;

  return (
    <div className='w-full flex flex-col items-center gap-2'>
      {/*
        ページの主題を名乗る h1。トップの見える範囲は吹き出し・投票導線・順送りで
        既に埋まっており、同じ内容の見出しを重ねると冗長なので sr-only にしてある
        （中身は下の吹き出しと順送りが視覚的に果たしている役割そのもの）。
        見せる判断に変えるなら sr-only を外すだけでよい。
      */}
      <h1 className='sr-only'>
        ときめきメモリアル Girl's Side 推しキャラの組み合わせ分析
      </h1>
      <GSMessage>
        <div>
          <span>"ときめきメモリアル Girl's Side" シリーズの</span>
          <span className='whitespace-nowrap'>非公式</span>
          <span>ファンサイトです！</span>
        </div>
        <span>
          あなたの推しを教えて下さい！
        </span>
      </GSMessage>
      <div className='relative w-full h-24'>
        <VoteLink
          className={clsx(
            'absolute left-1/2 -translate-x-1/2',
            'top-1/2 -translate-y-1/2',
          )}
        />
        <XShareLink
          className={clsx(
            'absolute right-0',
            'top-1/2 -translate-y-1/2',
          )}
          text={text}
          url={sharedURL}
        />
      </div>
      {/* 上下の要素から離して分析への入口を目立たせる（親は gap-2 なので追加で my） */}
      <TopCharacterSelect className='my-6' />
      <TopAnalysis 
        className='w-full flex-1' 
        topAnalysisData={data}
      />
    </div>
  );
}

