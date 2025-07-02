import { ReactNode } from 'react';
import clsx from 'clsx';

/**
 * Girl's Side 風のメッセージ表示用コンポーネント
 */
const GSMessage = ({
  title,
  heightFixed = true,
  children,
  className,
}: {
  /** メッセージ左上に表示されるタイトル */
  title?: string;
  /** 高さを固定値にして、内容をスクロールします(default: true) */
  heightFixed?: boolean;
  /** メッセージ内容 */
  children: ReactNode;
  className?: string;
}) => (
  // 最上位のレイアウトのみ行う部分
  // - タイトル
  // - メッセージ部
  // を隙間なく上下に、左揃えで並べます    
  <div
    className={clsx(
      className,
    )}
  >
    {/* タイトル部分、切り欠きのあるウィンドウ背景と同じ色 */}
    <div
      className='flex flex-row gap-0'
    >
      <div className={clsx(
        'flex items-center',
        'w-fit min-w-20 min-h-6',
        'bg-slate-300 border-none outline-none',
        'rounded-tl-lg',
        'text-sm',
        'pl-2'
      )}>
        {title}
      </div>
      <div
        className={clsx(
          'min-h-6 min-w-6',
          '-ml-[0.5px]',
          'bg-slate-300 border-none outline-none',
          '[clip-path:polygon(0_0,100%_100%,0_100%)]',
       )}
      >
      </div>
    </div>
    <div
      className={clsx(
        'bg-slate-300', 
        'p-[2px]',
        'rounded-r-lg rounded-bl-lg',
      )}
    >
      {/* メッセージ枠白背景部 */}
      <div className={clsx(
        'bg-white/90 rounded-lg', 
        'flex flex-col',
        heightFixed ? 'px-4 py-1' : 'p-0',
        'shadow-inner',
      )}>
        {/* メッセージ横線部分 */}
        <div 
          className={clsx(
            'flex flex-col',
            '[background-image:linear-gradient(0deg,_lightgray_1px,_transparent_1px)]',
            '[background-size:100%_1.5rem]',
            '[line-height:1.5rem]',
            heightFixed && 'h-[4.6rem]',
          )}
        >
          {children}
        </div>
      </div>
    </div>
  </div>
);

export default GSMessage;

