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
    /**
     * 「〇〇推しの人が同時に推すのは、」の見出しレベル。
     * キャラページではこれがページの主題そのものなので h1、
     * トップでは順送りで中身が変わるブロックの見出しなので h2 にする
     * （トップの h1 はページ側が持つ）。
     */
    headingLevel?: 1 | 2;
    /**
     * 見出しの対象キャラ（「〇〇推しの人が……」の〇〇）が、
     * 今見ているページの主題＝現在地そのものかどうか。
     * キャラページでは true（そのページ自身なのでリンクにしない）、
     * トップの順送りでは false（誰の現在地でもないのでリンクにする）。
     *
     * 既定は true。渡し忘れた時に困るのは「現在地へのリンク（自己リンク）を
     * 作ってしまう」側なので、リンクを出さない方を既定にして安全側へ倒す。
     * 効果は「リンクにするか否か」だけで、aria-current は付けない（§4.4）。
     */
    targetCharacterIsCurrent?: boolean;
  } & React.ComponentProps<'div'>
> = ({
  analysisData,
  targetCharacterName,
  headingLevel = 2,
  targetCharacterIsCurrent = true,
  className,
  ...props
}) => {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  // キャラの投票数を直接扱うと、ただの人気投票になってしまうので......
  //const totalCount = Object.values(
  //  topAnalysisData[targetCharacterName] ?? 0
  //).reduce((total, curr)=> total + curr, 0);

  const maxCount = Object.values( analysisData ?? 0)
    .reduce((max, curr) => max < curr ? curr : max, 0);
  // 票数の多い順（集計 SQL の ORDER BY）で並んだランキング行。
  // analysisData が null/undefined の場合も空配列に潰して、以降の分岐を 1 つにする。
  const rankingEntries = Object.entries(analysisData ?? {});
  return (
    <div
      className={clsx('flex flex-col', className)}
      {...props}
    >
      {/*
        flex-wrap で、名前＋文が1行に収まらない時は文を名前の下へ折り返す（nowrap だと
        名前が潰れて途中改行してしまう）。長い複合名（・入り）は CharacterNameLabel で
        「・の直後だけ」で折り返す。

        この 1 行は「〇〇を推す人は誰を推しているか」という、そのページの結論そのものなので
        見出し要素にする。Tailwind の preflight が見出しの font-size / font-weight を
        inherit に落とすため、div から変えても見た目は変わらない。
        ⚠️ 中身は phrasing content だけにする（div は h1/h2 の中に置けない）。
        名前部分の key は、トップの順送りで名前が変わるたびに
        animate-bounce-once を再生させるためのもの（要素を作り直す）。
      */}
      <Heading className='flex flex-row flex-wrap items-baseline gap-x-1'>
        {/*
          対象キャラ名は、そこが現在地かどうかで出し分ける
          （現在地はリンクにしない、という TopCharacterPickerDialog と同じ規則）。
          - キャラページ: このページの主題そのもの＝現在地なので、リンクにしない
            （自分自身へのリンクは作らない）。
            aria-current は付けない。あれは「一覧の中の今どれか」を示す属性で、
            モーダルの61セルのような集合がある所で意味を持つ。見出しの名前は
            集合の一員ではないので、読み上げに冗長な付言が増えるだけになる。
          - トップ: 10秒ごとに入れ替わる順送りで、誰の現在地でもない。
            「今出ている人をもっと見たい」という動線がここにしか無いので、
            そのキャラの分析ページへのリンクにする。
          key は分岐の外側（この span）に置いたままにする。中の Link へ動かすと
          キャラページ側で key が消え、順送りの作り直しが効かなくなる。
        */}
        <span
          key={targetCharacterName}
          className='text-lg font-bold animate-bounce-once'
        >
          {targetCharacterIsCurrent
            ? <CharacterNameLabel name={targetCharacterName} />
            /*
              prefetch={false} は必須。画面に出ているリンクは1本だが、
              href が10秒ごとに次のキャラへ変わるので、既定のままだと
              「トップに留まっている時間に比例して」61ページ分
              （転送 429 KB / 展開 3.4 MB）を取りに行くことになる。
              数えるべきは同時に並ぶ本数ではなく、1本のリンクが時間とともに
              指す href の個数（08 §2.1）。
              切ってもクライアントサイドナビゲーション自体は効く。
              リンク先は canonical / sitemap と同じ生の日本語 URL に揃える。
            */
            : <Link
                href={`/${targetCharacterName}`}
                prefetch={false}
                className='hover:underline focus-visible:underline underline-offset-4'
              >
                <CharacterNameLabel name={targetCharacterName} />
              </Link>
          }
        </span>
        <span>推しの人が同時に推すのは、</span>
      </Heading>
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
        {/*
          票数の多い順に並んだ順位付きの一覧なので <ol>。
          1 件 = <li> にすることで「キャラ名」と「その票数」が同じ項目に属することを
          構造で表す（以前は名前と AnimatedVoteBar 内の票数が別々の div に散っていて、
          視覚的に隣接しているだけだった）。
          Tailwind の preflight が list-style と padding を落とすので見た目は変わらない。

          ⚠️ role='list' は冗長に見えるが必須。WebKit は list-style: none でマーカーを
          消したリストを「リストとして」公開しないため（preflight が実際に
          list-style-type: none にしていることは実測で確認済み）、これが無いと
          Safari + VoiceOver で項目数もリスト境界も伝わらず、構造化した意味が無くなる。
        */}
        {rankingEntries.length > 0 &&
        // biome-ignore lint/a11y/noRedundantRoles: preflight の list-style:none で WebKit がリスト意味論を落とすため明示が必要
        <ol role='list'>
          {rankingEntries
          .map(([characterName, count]) =>
            <li
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
              {/*
                ⚠️ key={Date.now()} にしてはいけない。再レンダリングのたびに
                横棒が作り直されて 0 から再アニメーションするため、
                トップで hover するだけ（＝順送りの一時停止トグル）で
                全部の棒が動き直してしまう。
                対象キャラが変わった時に animate し直すのは、親（TopAnalysis）が
                key={targetCharacterName} で subtree ごと作り直すことで成り立つ。
                <li> の key が identity を決めるので、ここに key は要らない。
              */}
              <AnimatedVoteBar
                count={count}
                maxCount={maxCount}
              />
            </li>
          )
          }
        </ol>
        }
        {/*
          📌 かつてここは `analysisData == null || Object.keys(...).length === 0 && <div/>`
          と書かれていて、&& が || より強いために analysisData が null/undefined の時は
          式全体が true になり（React は true を描画しないので）メッセージが出ずに空欄だった。
          今は rankingEntries に集約したので条件が 1 つになり、この罠自体が無くなっている。
          ランキング行をリンクにした結果、まだ票が入っていないキャラへ直接飛べるようになり、
          この分岐が実際に踏まれる経路が増えている。
        */}
        {rankingEntries.length === 0 &&
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

