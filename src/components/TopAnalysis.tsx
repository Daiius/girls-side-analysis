'use client'

import React from 'react';
import clsx from 'clsx';

import TopAnalysisContent from './TopAnalysisContent';

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
    <TopAnalysisContent
      targetCharacterName={targetCharacterName}
      topAnalysisData={topAnalysisData}
      className={clsx(className)}
      {...props}
    />
  );
};

export default TopAnalysis;

