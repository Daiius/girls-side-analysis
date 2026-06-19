'use client'

import {
  type ComponentPropsWithoutRef,
  type ElementType,
} from 'react';
import clsx from 'clsx';

type ButtonOwnProps<TTag extends ElementType> = {
  /** 描画する要素。省略時は `<button>`。リンクなら `as='a'`。 */
  as?: TTag;
  className?: string;
};

export type ButtonProps<TTag extends ElementType = 'button'> =
  ButtonOwnProps<TTag>
  & Omit<ComponentPropsWithoutRef<TTag>, keyof ButtonOwnProps<TTag>>;

/**
 * 共通ボタン。`as` で描画する要素を切り替えられます
 * （例: リンクとして使う場合は `as='a'`）。
 *
 * ネイティブにインタラクティブな要素（button / a）を描画する前提なので、
 * フォーカス・押下のスタイルはネイティブ擬似クラスで当てています。
 */
function Button<TTag extends ElementType = 'button'>({
  as,
  className,
  ...props
}: ButtonProps<TTag>) {
  const Tag = (as ?? 'button') as ElementType;
  // ネイティブ button の既定 type は submit。フォーム内で誤送信しないよう
  // button のときだけ type='button' を既定にする（呼び出し側で上書き可）。
  const typeDefault = Tag === 'button' ? { type: 'button' as const } : undefined;
  return (
    <Tag
      {...typeDefault}
      {...props}
      className={clsx(
        'border border-1 border-slate-800',
        'rounded-md',
        'p-1',
        'hover:bg-white/10',
        'active:outline active:outline-1 active:outline-slate-400',
        'focus:outline focus:outline-1 focus:outline-slate-400',
        'disabled:hover:bg-transparent disabled:active:outline-none',
        'disabled:active:outline-none',
        'disabled:text-slate-500/30',
        className,
      )}
    />
  );
}

export default Button;
