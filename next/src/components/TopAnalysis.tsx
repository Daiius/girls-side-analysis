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

  /**
   * 順送りを一時停止しているか（hover / focus 中）。
   *
   * ここにリンク（見出しの対象キャラ名・ランキング行）を置いた以上、止めないと壊れる:
   * - **キーボードで到達できない**。フォーカスしても最大 10 秒でリンクごと
   *   subtree が入れ替わり、焦点が body に落ちる（次の Tab が文書先頭からになる）。
   * - **タップが吸われる / 別人へ飛ぶ**。tick が pointerdown と click の間に挟まると、
   *   押したアンカーが消えて click が不発になるか、読んでいた名前と違うキャラへ飛ぶ。
   */
  const [isPaused, setIsPaused] = React.useState(false);

  React.useEffect(() => {
    // 一時停止中はタイマーを張らない。解除時は effect が動き直して
    // setInterval が 0 から始まる。
    // 📌 タップの競合が閉じるのはこの性質に依存している:
    //    指を離す（pointerleave → 再開）と click の間は 10 秒空くので、
    //    click が届く前に subtree が入れ替わることはない。
    //    「残り時間を覚えて再開する」実装に変えるならこの保証が消える。
    if (isPaused) return;
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
  }, [topAnalysisData, isPaused]);

  return (
    /*
      hover とタップは pointerenter / pointerleave の 1 組で両方拾える
      （touch では触れた時に pointerenter、離した時に pointerleave が飛ぶ）。
      キーボードは focus / blur で拾う（React のこれらは focusin / focusout 相当で
      バブルするので、この div に付ければ中のリンクのフォーカスが届く）。
    */
    // biome-ignore lint/a11y/noStaticElementInteractions: 自動送りを止めるだけで div 自体に操作可能な機能は無く、role を名乗る方が支援技術に嘘をつくことになる
    <div
      className='w-full'
      onPointerEnter={() => setIsPaused(true)}
      onPointerLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/*
        key は「順送りで対象キャラが変わった時だけ作り直す」ためのもの。
        ⚠️ ここを key={Date.now()} にしてはいけない。あらゆる再レンダリングで
        subtree を作り直すため、一時停止のトグルだけでリンクが別ノードに置き換わり、
        フォーカスが飛ぶ（＝上の一時停止が何の役にも立たなくなる）。
        キャラが変わった時に作り直す点は変わらないので、
        animate-bounce-once と AnimatedVoteBar の再生条件は従来どおり。
      */}
      <TopAnalysisContent
        key={targetCharacterName}
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

