import { type ElementType } from 'react';
import clsx from 'clsx';

import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

import GSButton, { type GSButtonProps } from '@/components/GSButton';

/**
 * 投票ボタンの見た目。`as` で描画する要素を切り替えられます
 * （投票実行は `<button type='submit'>`、リンクは `as={Link}`）。
 *
 * 配置は呼び出し側が absolute 等で指定する想定（その要素自身が
 * 絶対配置の子アイコンの包含ブロックになる）。
 */
function VoteButton<TTag extends ElementType = 'button'>({
  className,
  ...rest
}: GSButtonProps<TTag>) {
  return (
    <GSButton
      {...(rest as Record<string, unknown>)}
      className={clsx(
        'inline-block',
        'text-white h-20 w-20',
        className,
      )}
    >
      <div className={clsx(
        'absolute text-sm top-1 left-1/2 -translate-x-1/2',
        'text-nowrap',
      )}>
        投票！
      </div>
      <PaperAirplaneIcon
        className={clsx(
          'absolute size-16',
          'top-1/2 left-1/2',
          'animate-vote-icon-rotation [transform-origin:center]',
        )}
      />
    </GSButton>
  );
}

export default VoteButton;
