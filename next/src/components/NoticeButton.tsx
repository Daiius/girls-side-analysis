'use client' // for modal


import clsx from 'clsx'
import { BellIcon } from '@heroicons/react/24/outline'

import { DialogButton } from '@/components/DialogButton'
import GSMessage from '@/components/GSMessage'

export const NoticeButton = () => (
  <DialogButton
    icon={<BellIcon className='size-6' />}
    title={'お知らせ:'}
  >
    <GSMessage title='データ一部消失について' className='mb-3'>
      <div className={clsx(
        'text-slate-700 overflow-y-auto',
        'md:text-base text-sm',
        'flex flex-col',
      )}>
        <div>
          当サイト作成のためのレンタルサーバのプラン変更における設定ミスが原因で、
        </div>
        <div >
          2024年9月19~11月2日の投票データが削除されてしまいました。申し訳ございません。
        </div>
        <div>
          今回のデータ消失につきまして、皆様の個人情報の流出はございません。
        </div>
        <div >
          現在はバックアップ体制を強化し、サーバ全体のデータを毎日保存しております。
        </div>
        <div>
          新作が出るまで、そしてその先も皆様が楽しめますよう努めて参ります。
        </div>
        <div>
          お時間ございましたら、投票ボタンから皆様のデータをご確認頂ければと存じます。
        </div>
        <div className='ms-auto'>
          2024年11月3日 サイト作成者より
        </div>
      </div>
    </GSMessage>
  </DialogButton>
)

