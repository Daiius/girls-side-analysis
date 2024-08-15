import clsx from 'clsx';

import { signIn } from '@/auth';
import DataUsageDialog from '@/components/DataUsageDialog';
import Button from '@/components/Button';

import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline';

const BeforeLoginProfile: React.FC<
  React.ComponentProps<'div'>
> = ({
  className,
  ...props
}) => (
  <div 
    className={clsx(
      'flex flex-col gap-2',
      className,
    )}
    {...props}
  >
      <div className='text-lg font-bold'>
        Twitterアカウント連携について：
      </div>
      <div className='flex flex-col gap-1'>
        <ul className='list-disc pl-5'>
          <li>投票データは匿名で保存されます</li>
          <li>
            あなたの投票データは、あなただけが確認できます<br/>
            (全体の集計結果は誰でも閲覧できます)
          </li>
          <li>あなたのX(Twitter)の情報は、あなた自身しかアクセスできません</li>
        </ul>
      </div>
      <div className='self-end flex flex-row items-center gap-2'>
        詳細: <DataUsageDialog/>
      </div>
      <form
        action={async () => {
          'use server'
          await signIn('twitter');
        }}
        className='self-center'
      >
        <Button 
          className='mt-2 p-2 flex flex-row'
          type='submit'
        >
          X (Twitter) でログイン
          <ArrowLeftEndOnRectangleIcon className='size-6 ml-2'/>
        </Button>
      </form>
  </div>
);

export default BeforeLoginProfile;

