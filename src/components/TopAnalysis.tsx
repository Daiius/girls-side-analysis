'use client'

import React from 'react';
import clsx from 'clsx';

import TopAnalysisContent from './TopAnalysisContent';

import { TopAnalysisData, DataSet } from '@/types';
//import LineChartClient from './LineChartClient';



const TopAnalysis: React.FC<
  { 
    topAnalysisData: TopAnalysisData,
    //timelineDataDict: Record<string, DataSet[]>,
  }
  & React.ComponentProps<'div'>
> = ({
  topAnalysisData,
  //timelineDataDict,
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
  }, []);

  return (
    <div className='w-full'>
      <TopAnalysisContent
        targetCharacterName={targetCharacterName}
        topAnalysisData={topAnalysisData}
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

