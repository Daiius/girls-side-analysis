//import clsx from 'clsx';

import TopCharacterSelect from '@/components/TopCharacterSelect';
import TopAnalysis from '@/components/TopAnalysis';
import { 
  getLatestVotesForAnalysis,
  getTimelineData,
} from '@/lib/votes';
import HeaderProfileLink from '@/components/HeaderProfileLink';
import Button from '@/components/Button';

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
      <a 
        className='bottom-5 absolute'
        href="https://twitter.com/share?ref_src=twsrc%5Etfw" 
        data-show-count="false"
        data-url='https://faveo-systema.net/girls-side-analysis'
        data-text='https://faveo-systema.net/girls-side-analysis'
      >
        <Button>
          X(Twitter)で共有
        </Button>
      </a>
    </div>
  );
}

