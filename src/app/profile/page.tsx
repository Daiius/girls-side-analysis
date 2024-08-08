import { auth, signIn, signOut } from '@/auth';
import Button from '@/components/Button';
import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline';

import type { Session } from 'next-auth';

const BeforeLoginContent: React.FC = () => (
  <div className='flex flex-col gap-2'>
    <div>未ログイン</div>
    <div>
      <div>Twitterアカウント連携について：</div>
      <div>
        「X (Twitter) でログイン」ボタンを押すと、
        あなたのX (Twitter)アカウントの番号を取得して、
        投票結果に紐づけます。
      </div>
      <div>
        番号だけ知っていても、あなたが誰だかは
        他のユーザからも開発者からも分からないようになっています。
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
  </div>
);


const AfterLoginContent: React.FC<{ session: Session }> = async ({ session }) =>  (
  <div className='flex flex-col gap-2'>
    <div>ようこそ {session.user.name} さん!</div>
    <form
      action={async () => {
        'use server'
        await signOut();
      }}
      className='self-center'
    >
      <Button 
        className='mt-2 p-2 flex flex-row'
        type='submit'
      >
        ログアウト
      </Button>
    </form>
  </div>
);

export default async function Page() {
  const session = await auth();
  return (
    <>
      {session
        ? <AfterLoginContent session={session} />
        : <BeforeLoginContent />
      }
    </>
  );
}

