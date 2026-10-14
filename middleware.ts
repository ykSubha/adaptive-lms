import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from './src/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and internal next requests pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)
  ) {
    return NextResponse.next();
  }

  // Update live Supabase session cookies if configured
  const response = await updateSession(request);

  // Check user role from cookie or auth header
  const demoRole = request.cookies.get('demo_user_role')?.value;
  const demoEmail = request.cookies.get('demo_user_email')?.value;

  const isAuthPage = pathname.startsWith('/login');
  const isProtected =
    pathname.startsWith('/student') ||
    pathname.startsWith('/instructor') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/platform');

  // If user is not logged in and attempts to access protected page
  if (isProtected && !demoRole && !demoEmail) {
    // Check if live supabase token exists
    const hasSbToken = request.cookies.getAll().some(c => c.name.startsWith('sb-'));
    if (!hasSbToken) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If user is logged in with demo/cookie role and goes to /login, redirect to their role home
  if (isAuthPage && demoRole) {
    const roleRoutes: Record<string, string> = {
      student: '/student',
      instructor: '/instructor',
      tenant_admin: '/admin',
      super_admin: '/platform',
    };
    const target = roleRoutes[demoRole] || '/student';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Guard role-specific paths
  if (demoRole) {
    if (pathname.startsWith('/student') && demoRole !== 'student') {
      return NextResponse.redirect(new URL(getRoleHome(demoRole), request.url));
    }
    if (pathname.startsWith('/instructor') && demoRole !== 'instructor') {
      return NextResponse.redirect(new URL(getRoleHome(demoRole), request.url));
    }
    if (pathname.startsWith('/admin') && demoRole !== 'tenant_admin') {
      return NextResponse.redirect(new URL(getRoleHome(demoRole), request.url));
    }
    if (pathname.startsWith('/platform') && demoRole !== 'super_admin') {
      return NextResponse.redirect(new URL(getRoleHome(demoRole), request.url));
    }
  }

  // Root redirect
  if (pathname === '/') {
    if (demoRole) {
      return NextResponse.redirect(new URL(getRoleHome(demoRole), request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

function getRoleHome(role: string): string {
  switch (role) {
    case 'instructor':
      return '/instructor';
    case 'tenant_admin':
      return '/admin';
    case 'super_admin':
      return '/platform';
    case 'student':
    default:
      return '/student';
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
