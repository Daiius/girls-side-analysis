import { handlers } from '@/auth';
//export const { GET, POST } = handlers;
//export const runtime = 'edge';

import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest
): Promise<Response> {
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto');
  if (forwardedHost && forwardedProto) {
    const forwardedUrl = `${forwardedProto}://${forwardedHost}/girls-side-analysis${req.nextUrl.pathname}?${req.nextUrl.searchParams.toString()}`;
    const newReq = new NextRequest(forwardedUrl, {
      headers: req.headers,
      method: req.method,
      body: req.body,
    });
    return await handlers.GET(newReq);
  } else {
    return await handlers.GET(req);
  }
}

export const { POST } = handlers;

