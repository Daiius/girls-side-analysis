import { handlers } from '@/auth';
export const { GET, POST } = handlers;
//export const runtime = 'edge';

//import { NextRequest } from 'next/server';
//
//const toForwardedRequest = (req: NextRequest): NextRequest => {
//  const forwardedHost = req.headers.get('x-forwarded-host');
//  const forwardedProto = req.headers.get('x-forwarded-proto');
//  if (forwardedHost && forwardedProto) {
//    const forwardedUrl = 
//      `${forwardedProto}://${forwardedHost}/girls-side-analysis${req.nextUrl.pathname}?${req.nextUrl.searchParams.toString()}`;
//    const newReq = new NextRequest(forwardedUrl, {
//      headers: req.headers,
//      method: req.method,
//      body: req.body,
//    });
//    return newReq;
//  } else {
//    return req;
//  }
//}
//
//export const GET: (req: NextRequest) => Promise<Response> = 
//  (req) => handlers.GET(toForwardedRequest(req));
//
//export const POST: (req: NextRequest) => Promise<Response> = 
//  (req) => handlers.POST(toForwardedRequest(req));

