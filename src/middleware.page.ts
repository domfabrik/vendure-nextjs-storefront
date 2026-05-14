import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { DEFAULT_CHANNEL_SLUG } from './lib/consts';

export function middleware(request: NextRequest) {
  const url = new URL(request.url);

  const regex = /\/[a-z]{2}(\/[a-z]{2})?\//;
  if (regex.test(url.pathname)) {
    const split = url.pathname.split('/').filter((x) => x !== '');
    const channel = split[0];
    const locale = split[1];
    const replaced = url.href.replace(`/${channel}`, ``);
    const response = NextResponse.redirect(new URL(replaced), { status: 308 });

    if (channel === DEFAULT_CHANNEL_SLUG) {
      if (!locale || (locale && locale?.length !== 2)) {
        response.cookies.set('channel', channel, { path: '/' });
        return response;
      }
    }
  }

  const response = NextResponse.next();
  response.cookies.set('channel', 'default-channel', { path: '/' });
  return response;
}

export const config = {
  matcher: `/((?!api|_next/static|_next/image|favicon.ico).*)`,
};
