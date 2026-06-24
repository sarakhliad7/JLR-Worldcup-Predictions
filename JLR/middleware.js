import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = ['/login', '/api/auth'];

const PUBLIC_FILE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.ico',
  '.txt',
  '.xml',
];

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  if (PUBLIC_FILE_EXTENSIONS.some((ext) => pathname.toLowerCase().endsWith(ext))) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/sync-scores')) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: true,
  });

  if (!token && pathname.startsWith('/api')) {
    return NextResponse.json({ error: 'err_mustLogin' }, { status: 401 });
  }

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (
    (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) &&
    token?.role !== 'ADMIN'
  ) {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'err_forbidden' }, { status: 403 });
    }

    return NextResponse.redirect(new URL('/predictions', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
