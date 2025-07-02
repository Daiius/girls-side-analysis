
import React from 'react';

import { DialogButton } from '@/components/DialogButton'
import { InformationCircleIcon } from '@heroicons/react/24/outline';

export const DataUsageDialog =  () => (
  <DialogButton
    icon={<InformationCircleIcon className='size-6' />}
    title={<div>データの使用方法：</div>}
  >
    <img
      className='bg-white/80 ml-auto mr-auto rounded-lg'
      alt='データ使用方法' 
      src='/girls-side-analysis/data_usage.svg'
    />
  </DialogButton>
)

