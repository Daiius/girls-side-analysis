'use client'

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import { UserCircleIcon } from '@heroicons/react/24/outline';

/**
 * プロファイルページへのリンク
 *
 * リンク先では非表示にするため、client componentとしています
 */
const HeaderProfileLink: React.FC = () => {
  const pathname  = usePathname();
  return (
    <>
      {pathname !== '/profile' &&
        <Link className='ms-auto' href='/profile'>
          <Button className='px-2 flex flex-row gap-1 items-center'>
            <span className='hidden sm:block'>
              投票/あなたのページへ
            </span>
            <span className='sm:hidden'>
              投票
            </span>
            <UserCircleIcon className='size-6' />
          </Button>
        </Link>
      }
    </>
  );
}

export default HeaderProfileLink;

