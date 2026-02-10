"use server";

import { sql } from '@vercel/postgres';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

// --- Types ---
export type FormState = {
    message: string;
    success: boolean;
    errors?: {
        name?: string[];
        email?: string[];
        mobile?: string[];
        password?: string[];
        role?: string[];
        _form?: string[];
    };
};

// --- Validation Schemas ---
const SignUpSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    mobile: z.string().regex(/^[0-9]{10}$/, { message: 'Mobile number must be 10 digits.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    role: z.enum(['admin', 'employee'], { message: 'Please select a valid role.' }),
});

const LoginSchema = z.object({
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z.string().min(1, { message: 'Password is required.' }),
});

// --- 1. SIGN UP ACTION ---
export async function signUp(prevState: FormState | undefined, formData: FormData): Promise<FormState> {
    // 1. Validate Fields
    const validatedFields = SignUpSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        mobile: formData.get('mobile'),
        password: formData.get('password'),
        role: formData.get('role'),
    });

    if (!validatedFields.success) {
        return {
            message: 'Validation Error',
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { name, email, mobile, password, role } = validatedFields.data;

    try {
        // 2. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Insert into Database
        await sql`
            INSERT INTO users (name, email, mobile_number, password_hash, role)
            VALUES (${name}, ${email}, ${mobile}, ${hashedPassword}, ${role})
        `;

        return { message: 'Account created! Please log in.', success: true };

    } catch (error) {
        console.error('Database Error:', error);
        if (error instanceof Error && error.message.includes('unique constraint')) {
            return {
                message: 'User already exists.',
                success: false,
                errors: { _form: ['Email or Mobile number is already registered.'] }
            };
        }
        return {
            message: 'Database Error: Failed to create user.',
            success: false,
            errors: { _form: ['An unexpected error occurred.'] }
        };
    }
}

// --- 2. LOGIN ACTION ---
export async function authenticate(prevState: string | undefined, formData: FormData) {
    try {
        // This will attempt to sign in and redirect to '/' by default
        await signIn('credentials', {
            ...Object.fromEntries(formData),
            redirectTo: '/', // FORCE redirect to our traffic controller
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        // CRITICAL: NextAuth throws a "NEXT_REDIRECT" error on success.
        // We MUST re-throw it so Next.js handles the page change.
        throw error;
    }
}