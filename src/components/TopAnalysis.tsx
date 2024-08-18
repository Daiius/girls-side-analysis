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
  const nodeData = Object.keys(topAnalysisData)
    .map(characterName =>
      ({ id: characterName, label: characterName })
    );
  const nodes = new DataSet<Node>(nodeData);
  //const nodes = new DataSet<Node>([
  //  { id: 1, label: "Node 1" },
  //  { id: 2, label: "Node 2" },
  //  { id: 3, label: "Node 3" },
  //  { id: 4, label: "Node 4" },
  //  { id: 5, label: "Node 5" },
  //]);

  const edgeData = Object.entries(topAnalysisData)
    .flatMap(([fromKey, dict]: [string, {[key: string]: number}]) =>
      Object.entries(dict)
        .map(([toKey, count]) =>
          ({ from: fromKey, to: toKey })
        )
    );
  const filteredEdgeData: Edge[] = [];
  for (const tmpEdge of edgeData) {
    if (!filteredEdgeData.some(e =>
      e.from === tmpEdge.to && e.to === tmpEdge.from
    )) {
      filteredEdgeData.push(tmpEdge);
    }
  }
  const edges = new DataSet<Edge>(filteredEdgeData);
  //const edges = new DataSet<Edge>([
  //  { from: 1, to: 3 },
  //  { from: 1, to: 2 },
  //  { from: 2, to: 4 },
  //  { from: 2, to: 5 },
  //  { from: 3, to: 3 },
  //]);

  const [mounted, setMounted] = React.useState<boolean>(false);
  const refNetwork = React.useRef<Network|null>(null);

  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (mounted) {
      const container = document.getElementById(ContainerName)
      if (container == null ) {
        throw new Error(`div element with id ${ContainerName} not found!`); 
      }
      const data: Data = { nodes, edges };
      refNetwork.current = new Network(container, data, {});
    }
  }, [mounted]);

  React.useLayoutEffect(() => {
    if (mounted && refNetwork.current) {
      refNetwork.current.setSize('100%', '100%');
      refNetwork.current.fit();
    }
  });

  return (
    <div 
      className={clsx(className)}
      id={ContainerName}
      {...props}
    />
  );
};

export default TopAnalysis;

