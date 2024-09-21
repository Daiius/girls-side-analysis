import  { auth } from '@/auth';
import { NextApiRequest, NextApiResponse } from 'next';

export async function middleware(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  req.headers['x-forwarded-host'] =
    'http://local.test/girls-side-analysis/api/auth';
  console.log('middleware, req: ', req);
  console.log('middleware, res: ', res);
  return auth(req, res);
}


export const config = {
  matcher: ['/profile'],
};

