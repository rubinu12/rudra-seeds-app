// auth.ts
import NextAuth, { DefaultSession } from 'next-auth';
import { authConfig } from './auth.config';

// Extend the default Session, User and JWT types
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

    interface JWT {
        id?: string;
        role?: 'admin' | 'employee';
    }
}

export const {
    handlers: { GET, POST }, // API route handlers
    auth,                   // Middleware helper & server-side session access
    signIn,                 // Function to initiate sign-in
    signOut,                // Function to initiate sign-out
} = NextAuth({
    ...authConfig,          // Spread the base config (providers, pages)
    session: {
        strategy: 'jwt',     // Use JSON Web Tokens
    },
    callbacks: {
        // Add id and role to the JWT token on sign-in
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        // Add id and role from the token to the session object
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as 'admin' | 'employee';
            }
            return session;
        },
    },
});