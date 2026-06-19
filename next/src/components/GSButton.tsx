import {
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from 'react';
import clsx from 'clsx';

import Button from '@/components/Button';

type GSButtonOwnProps<TTag extends ElementType> = {
  /** 描画する要素。省略時は `<button>`。リンクなら `as='a'`。 */
  as?: TTag;
  variant?: 'command' | 'friend' | 'system' | 'date';
  className?: string;
  children?: ReactNode;
};

export type GSButtonProps<TTag extends ElementType = 'button'> =
  GSButtonOwnProps<TTag>
  & Omit<ComponentPropsWithoutRef<TTag>, keyof GSButtonOwnProps<TTag>>;

/**
 * GS 風の装飾を持つボタン。`as` で描画する要素を切り替えられます
 * （例: リンクとして使う場合は `as='a'`）。
 */
function GSButton<TTag extends ElementType = 'button'>({
  as,
  variant = 'command',
  className,
  children,
  ...rest
}: GSButtonProps<TTag>) {
  return (
    <Button
      as={as as ElementType}
      {...(rest as Record<string, unknown>)}
      className={clsx(
        'shadow-lg border-none text-white',
        variant === 'command'
          && 'bg-gradient-to-b from-sky-400 to-sky-600',
        variant === 'friend'
          && 'bg-gradient-to-b from-green-400 to-green-600',
        variant === 'system'
          && 'bg-gradient-to-b from-amber-400 to-amber-600',
        variant === 'date'
          && 'bg-gradient-to-b from-pink-400 to-pink-600',
        'transition ease-in-out delay-150',
        'hover:scale-110',
        className,
      )}
    >
      {children}
    </Button>
  );
}

export default GSButton;
