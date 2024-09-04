import React from 'react';
//import clsx from 'clsx';
import { DateTime } from 'luxon';

import { notFound } from 'next/navigation';
import { DataSet } from '@/types';

import { getCharacters } from '@/lib/characters'; 
import { 
  getLatestVotesForAnalysis, 
  getVotesRelatedToOshi 
} from '@/lib/votes';

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

  const today = DateTime.now().endOf('day');
  const ndays = 30;
  
  // 累積データを見て表示するキャラ名を判断するので
  // 一度時系列データをすべて変数に保存する
  const dataBuffer = await Promise.all(
    [...Array(ndays)]
      .map((_, iday) => today.minus({ 'day': ndays-iday-1 })) // DateTimeへ
      .map(async date => await getVotesRelatedToOshi(
        decodedCharaName, date.toJSDate()
      ))
  );

  // データに含まれるキャラ名を重複なく取得する
  const allRelatedCharacters = [...new Set(
    dataBuffer.flatMap(periodicData =>
      periodicData.map(d => d.characterName)
    )
  )];

  // キャラ毎の推移
  const datasets: DataSet[] = allRelatedCharacters
    .map(character => ({
      label: character,
      data:
        dataBuffer.map((periodicData, iperiodicData) => {
          const x: string = today
            .minus({ 'day': ndays - iperiodicData - 1})
            .setLocale('ja')
            .toLocaleString();
          const characterData = periodicData.find(d =>
            d.characterName === character
          );
          return { x, y: (characterData?.count ?? 0) };
        })
    }));

    
  return (
    <div className='flex flex-col items-center w-full'>
      <TopCharacterSelect className='my-5'/>
      <TopAnalysisContent
        className='w-full'
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

