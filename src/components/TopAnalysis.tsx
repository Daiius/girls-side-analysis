'use client'

import React from 'react';
import clsx from 'clsx';

import { 
  Node, 
  Edge, 
  DataSet, 
  Network, 
  Data
} from 'vis-network/standalone/esm/vis-network';

import { TopAnalysisData } from '@/types';


const ContainerName: string = 'top-analysis-network' as const;

const TopAnalysis: React.FC<
  { topAnalysisData: TopAnalysisData }
  & React.ComponentProps<'div'>
> = ({
  topAnalysisData,
  className,
  ...props
}) => {
  const [mounted, setMounted] = React.useState<boolean>(false);
  React.useEffect(() => setMounted(true), []);
  
  const [targetCharacterName, setTargetCharacterName] =
    React.useState<string>(Object.keys(topAnalysisData)[0]);

  const refNetwork = React.useRef<Network|null>(null);

  React.useEffect(() => {
    if (mounted) {
      const container = document.getElementById(ContainerName)
      if (container == null ) {
        throw new Error(`div element with id ${ContainerName} not found!`); 
      }
      const nodeData = [
          targetCharacterName,
          ...Object.keys(topAnalysisData[targetCharacterName])
        ]
        .map((characterName, iCharacterName) => ({ 
          id: characterName, 
          label: characterName,
          shape: 'image',
          image: '/girls-side-analysis/characters/placeholder.svg',
          size: iCharacterName === 0 ? 50 : 25,
        }));
      const nodes = new DataSet<Node>(nodeData);


      const totalCount = Object.values(
        topAnalysisData[targetCharacterName]
      ).reduce((curr, total) => total + curr, 0);
      const edgeData = Object.entries(
        topAnalysisData[targetCharacterName]
      ).map(([toKey, count]) => ({ 
        from: targetCharacterName, 
        to: toKey, 
        width: Math.max(1, count / totalCount * 10),
        label: `${count}`
      }));
      const edges = new DataSet<Edge>(edgeData);
      const data: Data = { nodes, edges };
      refNetwork.current = new Network(container, data, {
        nodes: {
          font: {
            color: '#FFFFFF',
          }
        }
      });
    }
  }, [mounted, targetCharacterName]);

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

  React.useLayoutEffect(() => {
    if (mounted && refNetwork.current) {
      refNetwork.current.setSize('auto', 'auto');
      refNetwork.current.fit();
    }
  });

  return (
    <div
      className={clsx(className)}
      {...props}
    >
      <div>推し組み合わせデータ：{targetCharacterName}</div>
      <div
        id={ContainerName}
        className='w-full h-full'
      />
    </div>
  );
};

export default TopAnalysis;

