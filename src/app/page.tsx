
import { auth, signIn, signOut } from '@/auth';
import Button from '@/components/Button';
import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline';

export default async function Home() {
  const session = await auth();
  return (
    <>
      <div>推しの組み合わせを分析します...</div>
      {session?.user?.name
        ? <div>ログイン済みです!: {session.user.name}</div>
        : <div>未ログインです</div>
      }
      {session &&
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
      }
      {!session &&
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
      }
    </>
  );
}

