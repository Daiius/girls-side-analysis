//import clsx from 'clsx';

import TopCharacterSelect from '@/components/TopCharacterSelect';
import TopAnalysis from '@/components/TopAnalysis';
import { 
  getLatestVotesForAnalysis,
  getTimelineData,
} from '@/lib/votes';
import HeaderProfileLink from '@/components/HeaderProfileLink';
import XShareLink from '@/components/XShareLink';

// トップページは多くの人がアクセスすることを想定し、
// static renderingにします...
export const dynamic = 'force-static';
export const revalidate =
  process.env.NODE_ENV === 'production' ? 300 : 30;

export default async function Home() {

  const data = await getLatestVotesForAnalysis();

  const relatedCharacters = Object.keys(data) as string[];
  const timelineDataDict = (await Promise.all(
    relatedCharacters
      .map(async c => 
        ({ [c]: await getTimelineData(c) })
      )
  )).reduce((acc, curr) => ({ ...acc, ...curr }), {});

  // trailing slashまで付けるとopenGraphImageが表示されるのを確認
  const text = 'GSシリーズの情報共有・分析サイト';
  const sharedURL = 'https://faveo-systema.net/girls-side-analysis';


  return (
    <div className='w-full h-full flex flex-col items-center gap-2'>
      <HeaderProfileLink  className='mt-3 mb-6'/>
      <TopCharacterSelect />
      <TopAnalysis 
        className='w-full flex-1' 
        topAnalysisData={data}
        timelineDataDict={timelineDataDict}
      />
      <XShareLink
        className='bottom-5 self-end sticky'
        text={text}
        url={sharedURL}
      >
        <span className='p-2'>X(Twitter)で共有</span>
      </XShareLink>
    </div>
  );
}

