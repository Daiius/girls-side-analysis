import React from 'react';
import clsx from 'clsx';


import { TopAnalysisData } from '@/types';
import { StarIcon } from '@heroicons/react/24/solid';

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
          'bg-sky-200 shadow',
          'rounded-lg p-4 max-h-[calc(100%-3rem)]',
          'overflow-y-auto',
        )}
      >
        {topAnalysisData[targetCharacterName] &&
          <div className='h-2 grid grid-cols-[150px_auto] items-center'>
            <div></div>
            <div className='h-2 relative'>
              <StarIcon className={clsx(
                'size-2 text-yellow-500',
                'absolute left-1/2 -translate-x-1/2',
                '-top-3',
              )}/>
              <StarIcon className={clsx(
                'size-2 text-yellow-500',
                'absolute right-0 translate-x-1/2',
                '-top-4',
              )}/>
              <StarIcon className={clsx(
                'size-2 text-yellow-500',
                'absolute right-0 translate-x-1/2',
                '-top-2',
              )}/>
            </div>
          </div>
        }
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
              <div className='relative'>
                <div className={clsx(
                  'absolute top-0 -translate-y-1/2 left-0',
                  'w-full h-10 rounded-md',
                  'bg-gray-400 shadow-inner',
                  'outline outline-[1px]', 
                )}>
                </div>
                <div
                  className={clsx(
                    'absolute top-0 -translate-y-1/2 left-0', 
                    'bg-sky-400 rounded-md text-lg p-2 text-white',
                    'h-10',
                  )}
                  style={{ width: `calc(${count/maxCount*100}%)`}}
                >
                  {count}票
                </div>
                <div className={clsx(
                  'h-10 w-[0.5px] bg-white/50',
                  'absolute left-1/2 -translate-x-1/2', 
                  'top-1/2 -translate-y-1/2',
                )}/>
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

