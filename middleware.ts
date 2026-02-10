// middleware.ts (or proxy.ts)
import { auth } from './auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Session } from '@auth/core/types';

// Define the type for the request object including the auth property
interface AuthRequest extends NextRequest {
  auth: Session | null;
}

// Export the 'auth' function with explicit redirect logic
export default auth((req: AuthRequest) => {
  // If there's no session (user is not logged in) while accessing a protected route
  if (!req.auth) {
      const loginUrl = new URL('/', req.url); // Construct URL for the login page
      // Optionally add a callbackUrl if you want to redirect back after login
      // loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl); // Redirect to the login page
  }
  // If authenticated, allow the request to proceed
  return undefined;
});

// Configuration for the middleware
export const config = {
  // Specify the routes that the middleware should protect
  matcher: [
    '/admin/:path*',
    '/employee/:path*',
  ],
};