'use client'

import React from 'react';
import clsx from 'clsx';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowPathIcon } from '@heroicons/react/24/solid';

import Button from '@/components/Button';
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
  const router = useRouter();
  const [isRetrying, startTransition] = React.useTransition();

  React.useEffect(() => {
    console.error(error);
  }, [error]);

  // ⚠️ reset() だけでは復旧しない。
  // reset() は error boundary を再レンダリングするだけで、server component の
  // 結果はクライアントにキャッシュされた RSC ペイロードのまま。原因が解消して
  // いても同じ例外を再生するだけになる（実測: API 復旧後に reset() だけ押しても
  // 同一の digest でエラー表示のままだった）。
  // router.refresh() でサーバから取り直してから reset() する。
  const retry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <div className='w-full flex flex-col items-center gap-4'>
      {/*
        メッセージ枠の罫線（1.5rem 間隔）に行を載せるため、
        1 行 = 1 要素で置き、行高を変えるクラス（text-sm 等）は当てない。
      */}
      <GSMessage title={<span>エラー</span>} className='w-full'>
        <span>ごめんなさい、問題が発生しました......</span>
        <span>少し待ってから、もう一度お試しください！</span>
      </GSMessage>

      {/*
        GSButton は本家のボタンを模した正方形で、重要なアクションにだけ使う。
        ここでは復旧操作（再試行）がそれに当たる。トップへ戻る方は副次的な
        導線なので、素の Button（枠線のみ）にする。
      */}
      <div className='flex flex-row items-center gap-4'>
        <GSButton
          className='size-20 relative group'
          variant='system'
          type='button'
          onClick={retry}
          disabled={isRetrying}
        >
          <div className={clsx(
            'absolute top-1 left-1/2 -translate-x-1/2',
            'text-xs text-nowrap',
          )}>
            もう一度
          </div>
          <ArrowPathIcon className={clsx(
            'absolute size-11',
            'bottom-2 left-1/2 -translate-x-1/2',
            isRetrying ? 'animate-spin' : 'group-hover:animate-spin',
          )} />
        </GSButton>
        <Button as={Link} href='/' className='px-3 py-1'>
          トップへ戻る
        </Button>
      </div>

      {error.digest &&
        <div className='text-xs text-slate-500'>
          エラー ID: {error.digest}
        </div>
      }
    </div>
  );
}
