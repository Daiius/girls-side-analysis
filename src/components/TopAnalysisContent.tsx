import React from 'react';
import clsx from 'clsx';


import { TopAnalysisData } from '@/types';

const TopAnalysisContent: React.FC<
  { 
    topAnalysisData: TopAnalysisData;
    targetCharacterName: string;
  } & React.ComponentProps<'div'>
> = ({
  topAnalysisData,
  targetCharacterName,
  className,
  ...props
}) => {
  const totalCount = Object.values(
    topAnalysisData[targetCharacterName] ?? 0
  ).reduce((total, curr)=> total + curr, 0);

  const maxCount = Object.values(
    topAnalysisData[targetCharacterName] ?? 0
  ).reduce((max, curr) => max < curr ? curr : max, 0);
  return (
    <div
      className={clsx('flex flex-col', className)}
      {...props}
    >
      <div>
        <span className='text-lg font-bold'>
          {targetCharacterName}
        </span>
        <span> 推しの人が同時に推すのは、</span>
      </div>
      <div 
        className={clsx(
          'border border-1 border-black dark:border-white',
          'rounded-lg p-4 max-h-[calc(100%-3rem)]',
          'overflow-y-auto',
        )}
      >
        {Object.entries(topAnalysisData[targetCharacterName] ?? {})
          .map(([characterName, count]) =>
            <div 
              key={characterName}
              className={clsx(
                'grid grid-cols-[150px_auto] items-center',
                'mb-6 last:mb-0',
              )}
            >
              <div
                className={clsx(
                  'flex flex-col', 
                  'w-[150px]',
                  'justify-self-end',
                  characterName.includes('・')
                    ? 'text-left'
                    : 'text-right pr-3'
                  //'h-[calc(110px+2rem)]',
                  //characterName.includes('・') 
                  //  ? 'items-start' : 'items-center',
                )}  
              >
                {/*
                <Image
                  src='/girls-side-analysis/characters/placeholder.svg'
                  alt={characterName}
                  width={100}
                  height={100}
                  className='rounded-lg bg-white/5'
                />
                */}
                <div
                  className={clsx(
                    'text-lg font-bold whitespace-nowrap',
                    characterName.includes('・') && 'text-sm',
                  )}
                >
                  {/* クリスの名前を収めるための処理 */}
                  {characterName.includes('・')
                    ? <div className='flex flex-col'>
                        <span>
                          {characterName.split('・')[0]}
                        </span>
                        <span>
                          ・{characterName.split('・')[1]}
                        </span>
                      </div>
                    : characterName
                  }
                </div>
              </div>
              <div
                className='bg-sky-500 rounded-md text-lg p-2 text-white'
                style={{ width: `calc(${count/maxCount*100}%)`}}
              >
                {count}票
              </div>
            </div>
          )
        }
        {topAnalysisData[targetCharacterName] == null &&
          <div>
            <span>データがまだ有りません... </span>
            <span>推しの方は投票をお願いします！</span>
          </div>
        }
      </div>
    </div>
  );
};

export default TopAnalysisContent;

