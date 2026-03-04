// src/auth.config.ts
import type { NextAuthConfig } from 'next-auth';
import type { DefaultSession } from 'next-auth';


// --- Types ---
declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            role: 'admin' | 'employee';
        } & DefaultSession['user'];
    }
    interface User {
        role?: 'admin' | 'employee';
    }
    // Moved JWT back inside 'next-auth' where your version expects it
    interface JWT {
        id?: string;
        role?: 'admin' | 'employee';
    }
}

export const authConfig = {
    pages: {
        signIn: '/login', 
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as 'admin' | 'employee';
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isAuthRoute = nextUrl.pathname === '/login' || nextUrl.pathname === '/'; 

            if (!isLoggedIn && !isAuthRoute) {
                return Response.redirect(new URL('/login', nextUrl));
            }

            if (isAuthRoute && isLoggedIn) {
                if (auth.user?.role === 'admin') {
                    return Response.redirect(new URL('/admin/dashboard', nextUrl));
                }
                return Response.redirect(new URL('/employee/dashboard', nextUrl));
            }

            if (isLoggedIn && nextUrl.pathname.startsWith('/admin') && auth.user?.role !== 'admin') {
                return Response.redirect(new URL('/employee/dashboard', nextUrl));
            }

            return true;
        },
    },
    providers: [], 
} satisfies NextAuthConfig;