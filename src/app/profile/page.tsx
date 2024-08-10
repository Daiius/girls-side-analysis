import { auth } from '@/auth';

import AfterLoginProfile from '@/components/AfterLoginProfile';
import BeforeLoginProfile from '@/components/BeforeALoginProfile';



export default async function Page() {
  const session = await auth();
  return (
    <>
      {session
        ? <AfterLoginProfile session={session} />
        : <BeforeLoginProfile />
      }
    </>
  );
}

