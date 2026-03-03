import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev");

const protectedRoutes = ['/home', '/onboarding', '/conversation'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    const token = request.cookies.get('speakflow_session')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // Verify JWT
      const { payload } = await jwtVerify(token, JWT_SECRET);

      // Enforce profile: if the user visits /home, check via the profile API.
      // We pass the auth cookie forward so the API can identify the user.
      if (pathname.startsWith('/home')) {
        const profileRes = await fetch(new URL('/api/profile', request.url), {
          headers: { Cookie: `speakflow_session=${token}` },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (!profileData.profile) {
            // No profile yet — redirect to onboarding
            return NextResponse.redirect(new URL('/onboarding?required=true', request.url));
          }
        }
      }

      return NextResponse.next();
    } catch (error) {
      // Token is invalid or expired
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set("speakflow_session", "", { expires: new Date(0) });
      return response;
    }
  }

  // Redirect users already logged in away from auth pages
  if (pathname === '/login' || pathname === '/register') {
    const token = request.cookies.get('speakflow_session')?.value;
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL('/home', request.url));
      } catch (error) {
        // Just continue to auth page if token is invalid
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
