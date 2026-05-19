import { getSession } from '@/lib/auth-session';

import AfterLoginProfile from '@/components/AfterLoginProfile';
import BeforeLoginProfile from '@/components/BeforeLoginProfile';

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await getSession();
  const { error } = await searchParams;
  const errorMessage = error ? `認証エラー: ${error}` : undefined;

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
