import React from 'react';
import clsx from 'clsx';

const Footer: React.FC = () => (
  <div className={clsx(
    'w-full h-8 bottom-0',
    'bg-sky-400',
    'relative'
  )}>
    <a
      className={clsx(
        'text-sky-700',
        'absolute top-1/2 -translate-y-1/2',
        'right-2',
        'text-sm sm:text-base',
      )}
      target='_blank'
      href={
        `https://twitter.com/share?text=${encodeURIComponent(
          '#GSAnalysis 要望・不具合連絡はこのハッシュタグで!'
        )}&url=%20`
      }
    >
      ご要望・不具合報告
    </a>
  </div>
);

export default Footer;

