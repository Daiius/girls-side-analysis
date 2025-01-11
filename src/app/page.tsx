import clsx from 'clsx';

import TopCharacterSelect from '@/components/TopCharacterSelect';
import TopAnalysis from '@/components/TopAnalysis';
import { 
  getLatestVotesForAnalysis,
  getTimelineData,
} from '@/lib/votes';
import VoteLink from '@/components/VoteLink';
import XShareLink from '@/components/XShareLink';
import GSMessage from '@/components/GSMessage';

// トップページは多くの人がアクセスすることを想定し、
// static renderingにします...
export const dynamic = 'force-static';
export const revalidate = 3600;

export default async function Home() {

  const data = await getLatestVotesForAnalysis();

  const relatedCharacters = Object.keys(data) as string[];
  const timelineDataDict: {
    [key: string]: Awaited<ReturnType<typeof getTimelineData>>
  } = {};
  for (const relatedCharacter of relatedCharacters) {
    timelineDataDict[relatedCharacter] 
      = await getTimelineData(relatedCharacter);
  }
  //const timelineDataDict = (await Promise.all(
  //  relatedCharacters
  //    .map(async c => 
  //      ({ [c]: await getTimelineData(c) })
  //    )
  //)).reduce((acc, curr) => ({ ...acc, ...curr }), {});

  // trailing slashまで付けるとopenGraphImageが表示されるのを確認
  const text = 'GSシリーズの情報共有・分析サイト';
  const sharedURL = 'https://faveo-systema.net/girls-side-analysis';


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
        timelineDataDict={timelineDataDict}
      />
    </div>
  );
}

