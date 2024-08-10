'use client'

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';

/**
 * プロファイルページへのリンク
 *
 * リンク先では非表示になります
 */
const HeaderProfileLink: React.FC = () => {
  const pathname  = usePathname();
  return (
    <>
      {pathname !== '/profile' &&
        <Link className='ms-auto' href='/profile'>
          <Button className='px-2'>
            投票/あなたのページへ
          </Button>
        </Link>
      }
    </>
  );
}

export default HeaderProfileLink;

