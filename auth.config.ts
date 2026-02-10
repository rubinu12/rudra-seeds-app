// auth.config.ts
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs'; // Use bcryptjs
import { z } from 'zod';

// Define the expected shape of your user from the database
type User = {
    user_id: number;
    name: string;
    email: string;
    mobile_number: string;
    password_hash: string;
    role: 'admin' | 'employee';
};

// Function to fetch user from DB
async function getUser(email: string): Promise<User | undefined> {
    try {
        // Ensure mobile_number is selected if it exists in your table schema
        const result = await sql<User>`
            SELECT user_id, name, email, mobile_number, password_hash, role
            FROM users
            WHERE email=${email}
        `;
        return result.rows[0];
    } catch (error) {
        console.error('Failed to fetch user:', error);
        // Throwing an error here might be better for production logging
        throw new Error('Database error: Failed to fetch user.');
    }
}

// Explicitly type the config object
const config: NextAuthConfig = {
    pages: {
        signIn: '/', // Redirect users to the root page for login
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);

                    if (!user) return null; // No user found

                    // Compare provided password with the stored hash
                    const passwordsMatch = await bcrypt.compare(password, user.password_hash);

                    if (passwordsMatch) {
                        // Return the user object (without the password hash)
                        return {
                            id: user.user_id.toString(),
                            name: user.name,
                            email: user.email,
                            role: user.role,
                        };
                    }
                }
                // Credentials invalid, validation failed, or DB error during fetch
                return null;
            },
        }),
    ],
    // trustHost: true, // Recommended for production deployments
};

export const authConfig = config;