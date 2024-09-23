import { auth } from '@/auth';

import AfterLoginProfile from '@/components/AfterLoginProfile';
import BeforeLoginProfile from '@/components/BeforeALoginProfile';

export default async function Page({ 
  searchParams
}: { 
  searchParams?: { error?: string } 
}) {
  console.log('### /profile page access!! ###');
  const session = await auth();
  const errorMessage =
    searchParams?.error === 'OAuthCallbackError'
      ? 'X(Twitter)認証がキャンセルされました' :
    searchParams?.error === 'UnknownAction'
      ? 'アクションをパース出来ませんでした' :
    searchParams?.error === 'Configuration' 
      ? 'タイムアウト、または設定エラーです' :
    searchParams?.error
      ? `不明なエラー: ${searchParams?.error}` :
    undefined;
      
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
            errorMessage={errorMessage}
          />
      }
    </>
  );
}

