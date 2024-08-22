'use client'

import React from 'react';
import clsx from 'clsx';
import Image from 'next/image';


import { TopAnalysisData } from '@/types';



const TopAnalysis: React.FC<
  { topAnalysisData: TopAnalysisData }
  & React.ComponentProps<'div'>
> = ({
  topAnalysisData,
  className,
  ...props
}) => {
  
  const [targetCharacterName, setTargetCharacterName] =
    React.useState<string>(Object.keys(topAnalysisData)[0]);

  const totalCount = Object.values(
    topAnalysisData[targetCharacterName]
  ).reduce((total, curr)=> total + curr, 0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTargetCharacterName(prevCharacterName => {
        const currentIndex = Object.keys(topAnalysisData)
          .indexOf(prevCharacterName);
        return Object.keys(topAnalysisData)[
            (currentIndex + 1) % Object.keys(topAnalysisData).length
          ];
      });
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={clsx(className)}
      {...props}
    >
      <div className='h-[2rem]'>
        <span className='text-lg font-bold'>
          {targetCharacterName}
        </span>
        <span> 推しの人が同時に推すのは...</span>
      </div>
      <div 
        className={clsx(
          'border border-1 border-black dark:border-white',
          'rounded-lg p-4',
          'flex flex-col gap-1',
        )}
      >
        {Object.entries(topAnalysisData[targetCharacterName])
          .map(([characterName, count]) =>
            <div 
              key={characterName}
              className='flex flex-row items-center gap-1'
            >
              <div className='flex flex-col items-center'>
                <Image
                  src='/girls-side-analysis/characters/placeholder.svg'
                  alt={characterName}
                  width={100}
                  height={100}
                  className='rounded-lg bg-white/5'
                />
                <div className='text-lg font-bold'>{characterName}</div>
              </div>
              <div
                className='bg-sky-500 rounded-md text-lg p-2 text-white'
                style={{ width: `calc(${count/totalCount*100}%)`}}
              >
                {count}票
              </div>
            </div>
          )
        }
      </div>
    </div>
  );
};

export default TopAnalysis;

