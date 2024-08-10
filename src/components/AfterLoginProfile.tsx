import { Session } from 'next-auth';
import { signOut } from '@/auth';

import Button from '@/components/Button';
import VotingForm from './VotingForm';



const AfterLoginProfile: React.FC<{ session: Session }> = async ({ session }) =>  {
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-row items-center mb-5'>
        <div>ようこそ {session.user.name} さん!</div>
        <form
          action={async () => {
            'use server'
            await signOut();
          }}
          className='self-center ms-auto'
        >
          <Button 
            className='mt-2 p-2 flex flex-row'
            type='submit'
          >
            ログアウト
          </Button>
        </form>
      </div>
      <VotingForm />
    </div>
  );
};

export default AfterLoginProfile;

