'use client'

import React from 'react';
import clsx from 'clsx';

import GSMessage from '@/components/GSMessage';
import GSButton from '@/components/GSButton';

/**
 * ルートの error boundary。
 *
 * これが無いと Server Action や server component が投げた例外が Next の既定画面
 * （英語の "A server error occurred" + ERROR 番号のみ、ヘッダー・フッターも消える）
 * まで飛んでしまう。日本語で状況を伝え、サイト内に留まれる導線を出す。
 *
 * layout.tsx の下に置くので Header / Footer は維持される。
 * digest は本番でサーバログと突き合わせるための識別子で、詳細は出さない。
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className='w-full flex flex-col items-center gap-4'>
      <GSMessage heightFixed={false} title='エラー'>
        <div className='px-4 py-2 flex flex-col'>
          <span>ごめんなさい、問題が発生しました......</span>
          <span>少し待ってから、もう一度お試しください！</span>
        </div>
      </GSMessage>
      <div className='flex flex-row gap-3'>
        <GSButton variant='command' type='button' onClick={reset}>
          もう一度
        </GSButton>
        <GSButton as='a' href='/' variant='system'>
          トップへ
        </GSButton>
      </div>
      {error.digest &&
        <div className='text-xs text-slate-500'>
          エラー ID: {error.digest}
        </div>
      }
    </div>
  );
}
