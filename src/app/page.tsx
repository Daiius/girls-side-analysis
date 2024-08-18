import clsx from 'clsx';

import TopCharacterSelect from '@/components/TopCharacterSelect';
import TopAnalysis from '@/components/TopAnalysis';

export default async function Home() {
  return (
    <div className='h-full flex flex-col'>
      <div>推しの組み合わせを分析します...</div>
      <div className={clsx(
        'flex flex-col items-center w-full h-full',
        'p-6 md:p-24'
      )}>
        <TopCharacterSelect className='my-5'/>
        <TopAnalysis
          className={clsx(
            'w-full h-full',
            'border border-1 border-slate-500',
            'rounded-lg',
          )}
        />
      </div>
    </div>
  );
}

