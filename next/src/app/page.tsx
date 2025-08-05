import clsx from 'clsx';

import TopCharacterSelect from '@/components/TopCharacterSelect';
import TopAnalysis from '@/components/TopAnalysis';
import { 
  getLatestVotesForAnalysisAll,
} from '@/lib/votes';
import VoteLink from '@/components/VoteLink';
import XShareLink from '@/components/XShareLink';
import GSMessage from '@/components/GSMessage';

// 1日1回更新
// On-demand ISRも投票時に行われる
export const revalidate = 86400;

const hostUrl = process.env.HOST_URL 
  ?? (() => { throw new Error(`process.env.HOST_URL is null`) })();

export default async function Home() {

  const data = await getLatestVotesForAnalysisAll();

  // trailing slashまで付けるとopenGraphImageが表示されるのを確認
  // TODO 本当？確認する
  const text = 'GSシリーズの情報共有・分析サイト';
  const sharedURL = `${hostUrl}`;

  return (
    <div className='w-full flex flex-col items-center gap-2'>
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
      <TopCharacterSelect />
      <TopAnalysis 
        className='w-full flex-1' 
        topAnalysisData={data}
      />
    </div>
  );
}

