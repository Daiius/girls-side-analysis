import React from 'react';
import clsx from 'clsx';

export async function generateStaticParams() {
  return [{ charaName: '氷上格' }, { charaName: '柊夜ノ介'}];
}

export default function Page({
  params
}: { params: { charaName: string }}) {
  const decodedCharaName = decodeURIComponent(params.charaName)
  return (
    <div className='flex flex-col items-center'>
      <div>分析結果:</div>
      <div className='py-5'>
        {decodedCharaName} が好きな人は、○○も好きな人が多いです！
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
