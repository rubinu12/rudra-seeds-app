// src/auth.ts
import NextAuth, { DefaultSession } from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { compare } from 'bcryptjs';

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
    interface JWT {
        id?: string;
        role?: 'admin' | 'employee';
    }
}

type User = {
    user_id: number;
    name: string;
    email: string;
    mobile_number: string;
    password_hash: string;
    role: 'admin' | 'employee';
};

// --- Helper Function ---
async function getUser(email: string): Promise<User | undefined> {
    try {
        const result = await sql<User>`
            SELECT user_id, name, email, mobile_number, password_hash, role
            FROM users
            WHERE email=${email}
        `;
        return result.rows[0];
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

// --- Main Auth Logic ---
export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth({
    ...authConfig, // Inherit pages and basic config
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);

                    if (!user) return null;

                    const passwordsMatch = await compare(password, user.password_hash);

                    if (passwordsMatch) {
                        return {
                            id: user.user_id.toString(),
                            name: user.name,
                            email: user.email,
                            role: user.role,
                        };
                    }
                }
                return null;
            },
        }),
    ],
    session: {
        strategy: 'jwt',
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
    },
});