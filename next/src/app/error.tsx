'use client'

import React from 'react';
import clsx from 'clsx';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowPathIcon } from '@heroicons/react/24/solid';

import Button from '@/components/Button';
import GSMessage from '@/components/GSMessage';

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
// 関数宣言が作るのは値の束縛だけで型の束縛は作らないため、直下の
// `error: Error & { digest?: string }` はグローバルの Error 型を正しく指している。
// 名前を変えると公式の例と読み比べにくくなるので合わせる。
// biome-ignore lint/suspicious/noShadowRestrictedNames: error.tsx の default export を `Error` と名付けるのは Next.js 公式ドキュメントの作法
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
        メッセージ枠の罫線（1.5rem 間隔）に行を載せるため、1 行 = 1 要素で置き、
        行高を変えるクラス（text-sm 等）と縦方向の余白は当てない（px は可）。

        この境界が出ている間、子ページのツリー（＝各ページの h1）は丸ごと
        置き換わっている。エラー画面だけ見出しの無い文書にならないよう、
        1 行目をこの画面の h1 にする。preflight が font-size / weight / margin を
        落とすので p のままと同じ行に載り、罫線もずれない。
      */}
      <GSMessage heightFixed={false} className='w-full'>
        <div className='px-4'>
          <h1>ごめんなさい、問題が発生しました......</h1>
          <p>少しお時間をおいて、もう一度お試しください</p>
          <p>何度も表示される場合は、下の「ご要望・不具合報告」からお知らせください</p>
        </div>
      </GSMessage>

      {/*
        どちらも素の Button にする。GSButton（正方形）は重要なアクション専用で、
        ここには当たらない。

        この画面に来るのは「私たちも想定していないエラー」だけである
        （投票の失敗はフォーム内で捕まえるので、ここには到達しない）。
        再試行が効くのは API/DB の一時的な不調のときだけで、本物のバグには
        効かない。ユーザーにその区別はつかないので、再試行を主役にはせず
        「トップへ戻る」と横並びにし、わずかに強調するだけに留める。

        なお、この境界が受けるのはレンダリング（読み取り）の失敗だけで
        ミューテーションを含まないため、再試行は何度押しても安全である。
      */}
      <div className='flex flex-row items-center gap-3'>
        <Button
          type='button'
          onClick={retry}
          disabled={isRetrying}
          // hover は共通 Button の hover:bg-white/10 と競合するため ! で上書きする
          className='px-4 py-1.5 bg-white/60 hover:bg-white! flex flex-row items-center gap-1.5'
        >
          <ArrowPathIcon
            className={clsx('size-4', isRetrying && 'animate-spin')}
            aria-hidden
          />
          もう一度
        </Button>
        <Button as={Link} href='/' className='px-4 py-1.5'>
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
