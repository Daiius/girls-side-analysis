import clsx from 'clsx';

import TopCharacterSelect from '@/components/TopCharacterSelect';
import TopAnalysis from '@/components/TopAnalysis';
import { getLatestVotesForAnalysis } from '@/lib/votes';

// トップページは多くの人がアクセスすることを想定し、
// static renderingにします...
export const dynamic = 'force-static';
export const revalidate = process.env.NODE_ENV === 'production' ? 300 : 30;

export default async function Home() {

  const data = await getLatestVotesForAnalysis();

  return (
    <div className='w-full h-full flex flex-col items-center gap-2'>
      <div className='text-xl font-bold'>
        あなたの推しを教えて下さい！
      </div>
      <TopCharacterSelect />
      <TopAnalysis
        className={clsx('w-full h-[calc(100%-6rem)]')}
        topAnalysisData={data}
      />
    </div>
  );
}

