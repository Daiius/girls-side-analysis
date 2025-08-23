'use client'

import { clsx } from 'clsx'
import { useEffect, useState } from 'react'

export type AnimatedVoteBarProps = {
  count: number;
  maxCount: number;
}

export const AnimatedVoteBar = ({
  count,
  maxCount,
}: AnimatedVoteBarProps) => {
  const [widthStyle, setWidthStyle] = useState<string>('0%')
  useEffect(() => {
    setWidthStyle(`${(count / maxCount) * 100}%`) 
  }, [count, maxCount]);
  return (
    <div className='relative'>
      <div className={clsx(
        'absolute top-0 -translate-y-1/2 left-0',
        'w-full h-10 rounded-md',
        'bg-gray-400 shadow-inner',
        'outline-[1px]', 
      )}>
      </div>
      <div
        className={clsx(
          'absolute top-0 -translate-y-1/2 left-0', 
          'bg-sky-400 rounded-md text-lg text-white',
          'h-10',
          'transition-all duration-1000 ease-in-out',
        )}
        style={{ width: widthStyle }}
      />
      <div className={clsx(
        'absolute top-1/2 -translate-y-1/2 left-2',
        'text-white',
      )}>
        {count}票
      </div>
      <div className={clsx(
        'h-10 w-[0.5px] bg-white/50',
        'absolute left-1/2 -translate-x-1/2', 
        'top-1/2 -translate-y-1/2',
      )}/>
    </div>
  )
}

