

import { DialogButton } from '@/components/DialogButton'
import { InformationCircleIcon } from '@heroicons/react/24/outline';

export const DataUsageDialog =  () => (
  <DialogButton
    icon={<InformationCircleIcon className='size-6' />}
    title={<div>データの使用方法：</div>}
  >
    {/*
      biome-ignore lint/performance/noImgElement: next/image は SVG を最適化せず
      （unoptimized 扱いになる）、public 配下の静的 SVG をダイアログ内に出すだけの
      この用途では LCP にも帯域にも効かない。width/height の指定義務が増えるだけなので
      素の img を使う。
    */}
    <img
      className='bg-white/80 ml-auto mr-auto rounded-lg'
      alt='データ使用方法'
      src='/data_usage.svg'
    />
  </DialogButton>
)

