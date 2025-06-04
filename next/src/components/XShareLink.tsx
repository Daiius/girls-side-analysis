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
  <a 
    className={clsx(
      className
    )}
    target='_blank'
    href={
      `https://twitter.com/share?text=${encodeURIComponent(text+'\n')}&url=${encodeURIComponent(url)}`
    }
    rel='noopener noreferrer'
    {...props}
  >
    <GSButton 
      className={clsx(
        'h-16 w-16 relative text-white', 
      )}
      variant='system'
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
  </a>
);

export default XShareLink;

