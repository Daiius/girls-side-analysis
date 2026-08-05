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
   * 順送りを一時停止する理由。**hover と focus は独立した理由なので別々に持つ。**
   *
   * ここにリンク（見出しの対象キャラ名・ランキング行）を置いた以上、止めないと壊れる:
   * - **キーボードで到達できない**。フォーカスしても最大 10 秒でリンクごと
   *   subtree が入れ替わり、焦点が body に落ちる（次の Tab が文書先頭からになる）。
   * - **タップが吸われる / 別人へ飛ぶ**。tick が pointerdown と click の間に挟まると、
   *   押したアンカーが消えて click が不発になるか、読んでいた名前と違うキャラへ飛ぶ。
   *
   * ⚠️ 1 つの state に 4 つのイベントが直接 true/false を書く形にすると、
   * **片方が外れただけで再開してしまう**。
   * 実際に踏んだ: リンクにフォーカスしたままポインタだけ領域外へ動かすと、
   * pointerleave が停止を解除し、フォーカスが残っているのに順送りが再開して
   * 上のフォーカス喪失がそのまま再発する（逆に、ポインタが領域内でも blur で再開する）。
   */
  const [isPointerInside, setIsPointerInside] = React.useState(false);
  const [isFocusWithin, setIsFocusWithin] = React.useState(false);
  // 「どちらかの理由が残っている限り止める」= 論理和で合成する
  const isPaused = isPointerInside || isFocusWithin;

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
      2 つは独立した停止理由なので、それぞれ別の state に書いて上で論理和にする。
    */
    // biome-ignore lint/a11y/noStaticElementInteractions: 自動送りを止めるだけで div 自体に操作可能な機能は無く、role を名乗る方が支援技術に嘘をつくことになる
    <div
      className='w-full'
      // pointerenter / pointerleave は :hover と同じで、
      // この div の外へ出た時にしか leave が飛ばない（中の要素を跨いでも飛ばない）。
      // なので focus 側のような relatedTarget の判定は要らない。
      onPointerEnter={() => setIsPointerInside(true)}
      onPointerLeave={() => setIsPointerInside(false)}
      onFocus={() => setIsFocusWithin(true)}
      onBlur={(e) => {
        // focus はバブルするので、中のリンク間を Tab で移るだけでも blur が飛ぶ。
        // 移動先がこの div の中ならまだ focus-within なので解除しない
        // （見出しのリンク → ランキング行のリンク、の瞬間に一度再開してしまうのを防ぐ）。
        // relatedTarget が null なのはフォーカスが文書の外（ブラウザ UI・他タブ）へ
        // 抜けた時で、その時は文書内の focus-within が実際に外れているので解除する。
        // 戻ってきて同じ要素にフォーカスが復帰すれば、その focus でまた止まる。
        if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) return;
        setIsFocusWithin(false);
      }}
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

