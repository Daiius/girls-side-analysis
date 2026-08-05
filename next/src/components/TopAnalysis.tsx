'use client'

import React from 'react';
import clsx from 'clsx';

import TopAnalysisContent from './TopAnalysisContent';

import type { TopAnalysisData, } from '@/types';
//import LineChartClient from './LineChartClient';



const TopAnalysis: React.FC<
  {
    topAnalysisData: TopAnalysisData,
    //timelineDataDict: Record<string, DataSet[]>,
    /**
     * 順送りで表示中のキャラが現在地かどうか。ここは素通しするだけで、
     * 意味と既定値は {@link TopAnalysisContent} 側が持つ
     * （どのページに置かれているかを知っているのは呼び出し元＝ルートなので、
     * この中間コンポーネントで決め打ちせず渡してもらう）。
     */
    targetCharacterIsCurrent?: boolean,
  }
  & React.ComponentProps<'div'>
> = ({
  topAnalysisData,
  //timelineDataDict,
  targetCharacterIsCurrent,
  className,
  ...props
}) => {
  
  const [targetCharacterName, setTargetCharacterName] =
    React.useState<string>(Object.keys(topAnalysisData)[0]);


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
  }, [topAnalysisData]);

  return (
    <div className='w-full'>
      <TopAnalysisContent
        key={Date.now()}
        targetCharacterName={targetCharacterName}
        targetCharacterIsCurrent={targetCharacterIsCurrent}
        analysisData={topAnalysisData[targetCharacterName]}
        className={clsx('mb-2', className)}
        {...props}
      />
      {/*
      <LineChartClient
        datasets={timelineDataDict[targetCharacterName]}
      />
      */}
    </div>
  );
};

export default TopAnalysis;

