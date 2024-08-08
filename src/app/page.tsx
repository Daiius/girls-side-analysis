import clsx from 'clsx';

import TopCharacterSelect from '@/components/TopCharacterSelect';

export default async function Home() {
  return (
    <>
      <div>推しの組み合わせを分析します...</div>
      <div className={clsx(
        'flex flex-col items-center',
        'p-6 md:p-24'
      )}>
        <TopCharacterSelect className='my-5'/>
      </div>
    </>
  );
}

