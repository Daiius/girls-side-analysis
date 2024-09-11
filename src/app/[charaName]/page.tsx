import React from 'react';
import type { Metadata } from 'next';
//import clsx from 'clsx';

import { notFound } from 'next/navigation';

import { getCharacters } from '@/lib/characters'; 
import { 
  getLatestVotesForAnalysis, 
  getTimelineData,
} from '@/lib/votes';

import HeaderProfileLink from '@/components/HeaderProfileLink';
import TopCharacterSelect from '@/components/TopCharacterSelect';
import TopAnalysisContent from '@/components/TopAnalysisContent';
import LineChartClient from '@/components/LineChartClient';

// 5分毎にアップデート
// NOTE: 今はテスト用にちょっと頻繁にします
export const revalidate = 
  process.env.NODE_ENV === 'production' ? 300 : 30;

/**
 * データベースからキャラクター一覧を取得して
 * 対応する分析ページを事前に生成出来るようにします
 */
export async function generateStaticParams() {
  const characters = await getCharacters();
  return characters.map(chara => ({ charaName: chara.name }));
}
export async function generateMetadata({ params }: { params: { charaName: string } }) {
  const decodedCharaName = decodeURIComponent(params.charaName);
  return {
    title: "Girl's Side Analysis",
    description: `💚💙 GSシリーズの情報共有・分析サイト ${decodedCharaName}分析ページ❤🧡`,
    openGraph: {
      type: 'website',
      url: `https://faveo-systema.net/girls-side-analysis/${decodedCharaName}`,
      description: `💚💙 GSシリーズの情報共有・分析サイト ${decodedCharaName}分析ページ❤🧡`,
      siteName: "Girl's Side Analysis",
      images: 'https://faveo-systema.net/girls-side-analysis/girls-side-analysis-logo.png',
    }
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
}: { params: { charaName: string }}) {
  const decodedCharaName = decodeURIComponent(params.charaName)

  const characters = await getCharacters();
  if (!characters.map(c => c.name).includes(decodedCharaName)) {
    notFound();
  }

  const analysisData = await getLatestVotesForAnalysis();

  const datasets = await getTimelineData(decodedCharaName);
    
  return (
    <div className='flex flex-col items-center w-full'>
      <HeaderProfileLink className='mt-3 mb-6'/>
      <TopCharacterSelect className='my-5'/>
      <TopAnalysisContent
        className='w-full mb-2'
        topAnalysisData={analysisData}
        targetCharacterName={decodedCharaName}
      />
      {datasets.length > 0 &&
        <LineChartClient
          className='w-full'
          datasets={datasets}
        />
      }
    </div>
  );
}

