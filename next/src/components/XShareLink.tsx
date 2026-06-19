import clsx from 'clsx';
import GSButton from '@/components/GSButton';
import { ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/solid';
import XIcon from './XIcon';

const XShareLink: React.FC<
  {
    text: string;
    url: string;
    children?: React.ReactNode,
  } & React.ComponentProps<'a'>
> = ({
  text,
  url,
  className,
  children,
  ...props
}) => (
  <GSButton
    as='a'
    // 配置は呼び出し側が absolute 等で指定する想定。
    // absolute 要素自身が絶対配置の子アイコンの包含ブロックになる。
    className={clsx(
      'inline-block h-16 w-16 text-white',
      className,
    )}
    variant='system'
    target='_blank'
    href={
      `https://twitter.com/share?text=${encodeURIComponent(text+'\n')}&url=${encodeURIComponent(url)}`
    }
    rel='noopener noreferrer'
    {...props}
  >
    <div className={clsx(
      'text-sm',
      'absolute top-1 left-1/2 -translate-x-1/2 text-nowrap',
    )}>
      シェア
    </div>
    <ChatBubbleOvalLeftEllipsisIcon
      className={clsx(
        'absolute size-8 top-4 right-0'
      )}
    />
    <XIcon
      className='absolute left-2 bottom-1'
      width={31}
      height={30}
    />
  </GSButton>
);

export default XShareLink;

