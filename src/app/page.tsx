//import clsx from 'clsx';

import TopCharacterSelect from '@/components/TopCharacterSelect';
import TopAnalysis from '@/components/TopAnalysis';
import { 
  getLatestVotesForAnalysis,
  getTimelineData,
} from '@/lib/votes';
import HeaderProfileLink from '@/components/HeaderProfileLink';

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


  return (
    <div className='w-full flex flex-col items-center gap-2'>
      <HeaderProfileLink  className='mt-3 mb-6'/>
      <TopCharacterSelect />
      <TopAnalysis 
        className='w-full' 
        topAnalysisData={data}
        timelineDataDict={timelineDataDict}
      />
    </div>
  );
}

