import React from 'react';
import clsx from 'clsx';

const GSMessage: React.FC<
  {
    title?: string;
    heightFixed?: boolean;
  } & React.ComponentProps<'div'>
> = ({
  title,
  heightFixed = true,
  children,
  className,
  ...props
}) => (
  <div
    className={clsx(
      'relative mt-4',
      'border-2 border-slate-300',
      'rounded-b-lg rounded-tr-lg bg-slate-300',
      'text-sm sm:text-base flex flex-col',
      'before:content-[""]',
      'before:absolute before:bg-slate-300',
      'before:min-w-24 before:min-h-6 before:-top-6 before:-left-[2px]',
      'before:rounded-tl-lg',
      'before:[clip-path:polygon(0_0,_70%_0,_100%_100%,0_100%)]',
      'h-[4.6rem]',
      className,
    )}
    {...props}
  >
    <div className={clsx(
      'bg-white/90 rounded-lg px-4 py-1 flex flex-col',
      'shadow-inner',
      heightFixed && 'h-[4.6rem]',
    )}>
      <div 
        className={clsx(
          'flex flex-col',
          '[background-image:linear-gradient(0deg,_lightgray_1px,_transparent_1px)]',
          '[background-size:100%_1.5rem]',
          '[line-height:1.5rem]',
          //'[background-position:0_0.2rem]', // 上部に余計な線が出る
        )}
      >
        {children}
      </div>
    </div>
  </div>
);

export default GSMessage;

