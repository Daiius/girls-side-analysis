import clsx from 'clsx';

import Link from 'next/link';
import Button from '@/components/Button';
import { UserCircleIcon } from '@heroicons/react/24/outline';

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
        'px-2 flex flex-wrap gap-1 items-center',
        'text-2xl font-bold',
        'bg-white/70 text-black',
      )}
      {...props}
    >
      <span>投票</span>
      <span>/あなたのページへ</span>
      <UserCircleIcon className='size-8' />
    </Button>
  </Link>
);

export default HeaderProfileLink;

