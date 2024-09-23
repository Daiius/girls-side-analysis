
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(
  req: NextRequest, 
): Promise<Response> {
  return NextResponse.next();
}


export const config = {
  matcher: ['/profile'],
};

