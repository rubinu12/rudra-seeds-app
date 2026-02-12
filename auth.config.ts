// src/auth.config.ts
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/', // Redirect users to root for login
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            // You can add logic here to protect /admin routes if you want
            // For now, we just return true to let the middleware run
            return true;
        },
    },
    providers: [], // We initialize providers in auth.ts to avoid Edge errors
} satisfies NextAuthConfig;