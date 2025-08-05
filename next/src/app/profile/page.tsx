import { auth } from '@/auth';

import AfterLoginProfile from '@/components/AfterLoginProfile';
import BeforeLoginProfile from '@/components/BeforeLoginProfile';

export default async function Page({ 
  searchParams
}: { 
  searchParams: Promise<{ error?: string }> 
}) {
  const session = await auth();
  const { error } = await searchParams;
  const errorMessage =
    error === 'OAuthCallbackError'
      ? 'X(Twitter)認証がキャンセルされました' :
    error === 'UnknownAction'
      ? 'アクションをパース出来ませんでした' :
    error === 'Configuration' 
      ? 'タイムアウト、または設定エラーです' :
    error
      ? `不明なエラー: ${error}` :
    undefined;
      
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

