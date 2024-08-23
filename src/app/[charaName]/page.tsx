import React from 'react';
import clsx from 'clsx';

import { notFound } from 'next/navigation';

import { getCharacters } from '@/lib/characters'; 
import { getLatestVotesForAnalysis } from '@/lib/votes';

import TopCharacterSelect from '@/components/TopCharacterSelect';
import TopAnalysisContent from '@/components/TopAnalysisContent';

// 5分毎にアップデート
// NOTE: 今はテスト用にちょっと頻繁にします
export const revalidate = process.env.NODE_ENV === 'production' ? 300 : 30;

/**
 * データベースからキャラクター一覧を取得して
 * 対応する分析ページを事前に生成出来るようにします
 */
export async function generateStaticParams() {
  const characters = await getCharacters();
  return characters.map(chara => ({ charaName: chara.name }));
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

  return (
    <div className='flex flex-col items-center w-full h-full'>
      <TopCharacterSelect className='my-5 h-[3rem]'/>
      <TopAnalysisContent
        className='h-[calc(100%-4rem)] w-full'
        topAnalysisData={analysisData}
        targetCharacterName={decodedCharaName}
      />
    </div>
  );
}

