import React from 'react';
import clsx from 'clsx';


import { AnalysisData } from '@/types';
import { StarIcon } from '@heroicons/react/24/solid';
import { AnimatedVoteBar } from '@/components/AnimatedVoteBar';

const TopAnalysisContent: React.FC<
  { 
    analysisData: AnalysisData | undefined;
    targetCharacterName: string;
  } & React.ComponentProps<'div'>
> = ({
  analysisData,
  targetCharacterName,
  className,
  ...props
}) => {
  // キャラの投票数を直接扱うと、ただの人気投票になってしまうので......
  //const totalCount = Object.values(
  //  topAnalysisData[targetCharacterName] ?? 0
  //).reduce((total, curr)=> total + curr, 0);

  const maxCount = Object.values( analysisData ?? 0)
    .reduce((max, curr) => max < curr ? curr : max, 0);
  return (
    <div
      className={clsx('flex flex-col', className)}
      {...props}
    >
      <div className='flex flex-row items-baseline gap-1'>
        <div key={targetCharacterName} className='text-lg font-bold animate-bounce-once'>
          {targetCharacterName}
        </div>
        <span>推しの人が同時に推すのは、</span>
      </div>
      <div 
        className={clsx(
          'bg-sky-200 shadow',
          'rounded-lg p-4 max-h-[calc(100%-3rem)]',
          'overflow-y-auto',
        )}
      >
        {analysisData &&
          <div className={clsx(
            'h-2 grid grid-cols-[150px_auto] items-center p-2',
          )}>
            <div></div>
            <div className='h-2 relative'>
              <StarIcon className={clsx(
                'size-3 text-yellow-500',
                'absolute left-1/2 -translate-x-1/2',
                '-top-[18px]',
              )}/>
              <StarIcon className={clsx(
                'size-3 text-yellow-500',
                'absolute right-0 translate-x-1/2',
                '-top-[23px]',
              )}/>
              <StarIcon className={clsx(
                'size-3 text-yellow-500',
                'absolute right-0 translate-x-1/2',
                '-top-[13px]',
              )}/>
            </div>
          </div>
        }
        {Object.entries(analysisData ?? {})
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
                )}  
              >
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
              <AnimatedVoteBar 
                key={`${characterName}-${count}-${maxCount}`} 
                count={count} 
                maxCount={maxCount} 
              />
            </div>
          )
        } 
        {analysisData == null || Object.keys(analysisData).length === 0 &&
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

