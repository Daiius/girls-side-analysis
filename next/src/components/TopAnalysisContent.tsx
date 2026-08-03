'use client'

import type React from 'react';
import clsx from 'clsx';
import Link from 'next/link';


import type { AnalysisData } from '@/types';
import { StarIcon } from '@heroicons/react/24/solid';
import { AnimatedVoteBar } from '@/components/AnimatedVoteBar';
import CharacterNameLabel from '@/components/CharacterNameLabel';

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
      {/*
        flex-wrap で、名前＋文が1行に収まらない時は文を名前の下へ折り返す（nowrap だと
        名前が潰れて途中改行してしまう）。長い複合名（・入り）は CharacterNameLabel で
        「・の直後だけ」で折り返す。
      */}
      <div className='flex flex-row flex-wrap items-baseline gap-x-1'>
        <div key={targetCharacterName} className='text-lg font-bold animate-bounce-once'>
          <CharacterNameLabel name={targetCharacterName} />
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
          <div 
            className={clsx(
              'h-2 grid grid-cols-[150px_auto] items-center p-2',
            )}
          >
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
                {/*
                  共起ランキングの1行1行が「このキャラを推す人は誰を推しているか」という
                  グラフの辺なので、名前をその相手の分析ページへのリンクにして辺を辿れるようにする。
                  相互リンクは定義から保証される（count(A,B) == count(B,A) で、集計に LIMIT が無い）。
                  自分自身は集計 SQL の時点で除外されているので、ここに現在地のキャラは出てこない
                  （= 自己リンクにならないので aria-current の考慮は不要）。

                  canonical / sitemap と同じく生の日本語 URL に揃える。

                  prefetch={false} は必須。キャラページは static route なので既定では
                  ビューポート進入時に「ページ全部（30日×共起相手数の時系列込み）」が取られる。
                  この行は最大60本が縦に並び、読むために視界へ留まるため
                  スクロール中に破棄されず全員分を取りに行ってしまう。
                  切ってもクライアントサイドナビゲーション自体は効く（フルリロードにはならない）。

                  親が flex-col なので self-end / self-start でリンクの箱を文字幅に縮める
                  （stretch のままだと下線が 150px 幅いっぱいに伸びる）。
                */}
                <Link
                  href={`/${characterName}`}
                  prefetch={false}
                  className={clsx(
                    'text-lg font-bold whitespace-nowrap',
                    'hover:underline focus-visible:underline underline-offset-4',
                    characterName.includes('・')
                      ? 'text-sm self-start'
                      : 'self-end',
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
                </Link>
              </div>
              <AnimatedVoteBar 
                key={Date.now()}
                count={count} 
                maxCount={maxCount} 
              />
            </div>
          )
        } 
        {/*
          括弧は必須。&& は || より強いので、括弧が無いと
          `analysisData == null || (keys.length === 0 && <div/>)` と解釈され、
          analysisData が null/undefined の時に式全体が true になって
          （React は true を何も描画しないので）空欄になる。
          ランキング行をリンクにした結果、まだ票が入っていないキャラへ直接飛べるようになり、
          この分岐が実際に踏まれる経路が増えた。
        */}
        {(analysisData == null || Object.keys(analysisData).length === 0) &&
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

