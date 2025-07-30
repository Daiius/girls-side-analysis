import React from 'react';
import clsx from 'clsx';

import type { Metadata } from 'next';

import { getCharacters } from '@/lib/characters'; 
import { 
  getLatestVotesForAnalysis, 
  getTimelineData,
} from '@/lib/votes';

import VoteLink from '@/components/VoteLink';
import TopCharacterSelect from '@/components/TopCharacterSelect';
import TopAnalysisContent from '@/components/TopAnalysisContent';
import LineChartClient from '@/components/LineChartClient';
import XShareLink from '@/components/XShareLink';

// 投票が無ければアップデートは x1日1回 oしない
// SSGされる
// export const revalidate = 86400;

// generateStaticParamsで生成した以外のパラメータを404とする
export const dynamicParams = false;

const hostUrl = process.env.HOST_URL 
  ?? (() => { throw new Error(`process.env.HOST_URL is null`) })();

/**
 * データベースからキャラクター一覧を取得して
 * 対応する分析ページを事前に生成出来るようにします
 */
export async function generateStaticParams() {
  const characters = await getCharacters();
  return characters.map(chara => ({ charaName: chara.name }));
}

export async function generateMetadata({ params }: { params: Promise<{ charaName: string }> }) {
  const { charaName } = await params;
  const decodedCharaName = decodeURIComponent(charaName);
  return {
    title: "Girl's Side Analysis",
    description: ` GSシリーズの情報共有・分析サイト ${decodedCharaName}分析ページ`,
    openGraph: {
      type: 'website',
      url: `${hostUrl}/${decodedCharaName}`,
      description: ` GSシリーズの情報共有・分析サイト「${decodedCharaName}」分析ページ`,
      siteName: "Girl's Side Analysis",
      images: `${hostUrl}/girls-side-analysis-logo.png`,
    },
    icons: [{
      rel: 'apple-touch-icon',
      url: `${hostUrl}/girls-side-analysis-touch-icon.png`,
      sizes: '180x180',
    }]
  } satisfies Metadata;
}


/**
 * 各キャラの、同時に推されているキャラ分析ページ
 *
 * 誰かがアクセスする度に毎回データ分析していては
 * サーバの処理能力が間に合わないと考えたので、
 * 一定時間ごとにrevalidateする静的ページとします
 */
export default async function Page({
  params
}: { params: Promise<{ charaName: string }>}) {

  const { charaName } = await params;

  const decodedCharaName = decodeURIComponent(charaName);
  const analysisData = await getLatestVotesForAnalysis(decodedCharaName);
  const datasets = await getTimelineData(decodedCharaName);

    
  return (
    <div className='flex flex-col items-center w-full'>
      <div className='relative w-full h-24'>
        <VoteLink
          className={clsx(
            'absolute left-1/2 -translate-x-1/2',
            'top-1/2 -translate-y-1/2',
          )}
        />
        <XShareLink
          className={clsx(
            'absolute right-0',
            'top-1/2 -translate-y-1/2',
          )}
          text={`GSシリーズの情報共有・分析サイト「${decodedCharaName}」分析ページ`}
          url={`${hostUrl}/${encodeURIComponent(decodedCharaName)}`}
        />
      </div>
      <TopCharacterSelect className='my-5'/>
      <TopAnalysisContent
        className='w-full mb-2'
        analysisData={analysisData}
        targetCharacterName={decodedCharaName}
      />
      {datasets.length > 0 &&
        <div className='w-full mb-4'>
          <LineChartClient
            className='w-full'
            datasets={datasets}
          />
        </div>
      }
    </div>
  );
}

