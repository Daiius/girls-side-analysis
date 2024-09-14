import clsx from 'clsx';

import Link from 'next/link';
import Button from '@/components/Button';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

/**
 * プロファイルページへのリンク
 *
 * リンク先では非表示にするため、client componentとしています
 */
const HeaderProfileLink: React.FC<
  React.ComponentProps<typeof Button>
> = ({
  className,
  ...props
}) => (
  <Link 
    className={clsx(className)} 
    href='/profile'
  >
    <Button 
      className={clsx(
        'relative',
        'text-white h-20 w-20',
      )}
      {...props}
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
    </Button>
  </Link>
);

export default HeaderProfileLink;

