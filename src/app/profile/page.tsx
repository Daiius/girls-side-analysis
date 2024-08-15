import { auth } from '@/auth';

import AfterLoginProfile from '@/components/AfterLoginProfile';
import BeforeLoginProfile from '@/components/BeforeALoginProfile';

export default async function Page() {
  const session = await auth();
  return (
    <>
      {session
        ? <AfterLoginProfile 
            className='h-full'
            session={session}
          />
        : <BeforeLoginProfile 
            className='h-full'
          />
      }
    </>
  );
}

