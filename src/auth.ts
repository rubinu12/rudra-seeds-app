// src/auth.ts
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { compare } from 'bcryptjs';
import { AuthError } from 'next-auth';

// --- Types ---
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
    ...authConfig, // Inherit pages and basic config from auth.config.ts
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
});

export async function authenticate(prevState: string | undefined, formData: FormData) {
    try {
        await signIn('credentials', {
            ...Object.fromEntries(formData),
            redirectTo: '/', 
        });
    } catch (error: any) {
        // 1. MUST re-throw Next.js redirects so the page actually changes on success
        if (
            error?.name === 'NEXT_REDIRECT' || 
            error?.message === 'NEXT_REDIRECT' || 
            (typeof error?.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT'))
        ) {
            throw error;
        }

        // 2. Handle Auth.js specific credentials errors safely
        if (error instanceof AuthError || error?.type === 'CredentialsSignin') {
            return 'Invalid email or password.';
        }

        // 3. THE FIX: Catch all other server/DB crashes and return as a string
        // This stops Next.js from panicking and throwing "An unexpected response"
        console.error("🔥 Server Action Crash Details:", error);
        
        // Return the actual error message so you can see it in the UI
        return error?.message || 'An internal server error occurred. Check terminal logs.';
    }
}