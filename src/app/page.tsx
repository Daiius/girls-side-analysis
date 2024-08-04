import TopCharacterSelect from '@/components/TopCharacterSelect';
import clsx from 'clsx';

export default function Home() {
  return (
    <main className={clsx(
      'h-[calc(100vh-3rem)] flex flex-col items-center',
      'p-6 md:p-24'
    )}>
      <TopCharacterSelect className='my-5'/>
    </main>
  );
}

