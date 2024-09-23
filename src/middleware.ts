import  { auth } from '@/auth';
import { 
  NextApiRequest, 
  NextApiResponse,
} from 'next';

import { NextRequest, NextResponse } from 'next/server';


export async function middleware(req: NextRequest) {
  // 何もしないmiddleware
  return NextResponse.next();
}

export const config = {
  matcher: ['/profile'],
};

