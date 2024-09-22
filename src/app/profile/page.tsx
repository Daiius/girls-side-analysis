import { auth } from '@/auth';

import AfterLoginProfile from '@/components/AfterLoginProfile';
import BeforeLoginProfile from '@/components/BeforeALoginProfile';

export default async function Page({ 
  searchParams
}: { 
  searchParams?: { error?: string } 
}) {
  const session = await auth();
  const errorMessage =
    searchParams?.error === 'OAuthCallbackError'
      ? 'X(Twitter)認証がキャンセルされました' :
    searchParams?.error === 'UnknownAction'
      ? 'アクションをパース出来ませんでした'
      : `不明なエラー: ${searchParams?.error}`;
      
  console.log('searchParams: ', searchParams);
  return (
    <>
      {session?.user?.name
        ? <AfterLoginProfile 
            className='h-full'
            session={session}
          />
        : <BeforeLoginProfile 
            className='h-full'
          />
      }
      {searchParams?.error &&
        <div>
          <div>
            直前のX(Twitter)認証が上手くいかなかった様です...
          </div>
          <div className='text-slate-500'>
            エラー情報: {errorMessage}
          </div>
        </div>
      }
    </>
  );
}

