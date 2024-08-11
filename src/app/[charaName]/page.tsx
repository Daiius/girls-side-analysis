import React from 'react';
import clsx from 'clsx';

import { notFound } from 'next/navigation';

import { getCharacters } from '@/lib/characters'; 
import { getVotesRelatedToOshi } from '@/lib/votes';

import TopCharacterSelect from '@/components/TopCharacterSelect';

// 5分毎にアップデート
// NOTE: 今はテスト用にちょっと頻繁にします
export const revalidate = 30;

export async function generateStaticParams() {
  const characters = await getCharacters();
  return characters.map(chara => ({ charaName: chara.name }));
}

export default async function Page({
  params
}: { params: { charaName: string }}) {
  const decodedCharaName = decodeURIComponent(params.charaName)

  const characters = await getCharacters();
  if (!characters.map(c => c.name).includes(decodedCharaName)) {
    notFound();
  }

  const data = await getVotesRelatedToOshi(decodedCharaName);

  return (
    <div className='flex flex-col items-center'>
      <div className={clsx(
        'flex flex-col items-center',
        'p-6 md:p-24'
      )}>
        <TopCharacterSelect className='my-5'/>
      </div>
      <div>{Date.now()}</div>
      <div>分析結果:</div>
      <div className='py-5'>
        {decodedCharaName} が好きな人は、○○も好きな人が多いです！
      </div>
      <div className='flex flex-col'>
        {data.map(d =>
          <div key={d.characterName}>
            {d.characterName}: {d.count}票
          </div>
        )}
      </div>
      <div className={clsx(
        'w-64 h-32 outline outine-1',
        'outline-slate-500',
        'p-5 text-balance',
        'flex flex-col items-center',
      )}>
        <span>良い感じのグラフとか</span>
        <span>ランキングとか</span>
        <span>グラフィック</span>
      </div>
    </div>
  );
}

