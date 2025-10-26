// app/auth/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { AuthError } from 'next-auth'; // For potential future use with signIn errors

// Define FormState for consistent return type
export type FormState = {
    message: string;
    success: boolean;
    errors?: {
        name?: string[];
        email?: string[];
        mobile?: string[]; // Added mobile error field
        password?: string[];
        role?: string[];
        _form?: string[]; // For general form errors
    };
};

// Zod schema for sign-up validation - Added mobile validation
const SignUpSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    // Added mobile validation (10 digits, required)
    mobile: z.string().regex(/^[0-9]{10}$/, { message: 'Mobile number must be 10 digits.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    role: z.enum(['admin', 'employee'], { message: 'Please select a valid role.' }),
});

// SignUp Server Action
export async function signUp(prevState: FormState | undefined, formData: FormData): Promise<FormState> {
    // 1. Validate form data
    const validatedFields = SignUpSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        console.log("Sign Up Validation Errors:", validatedFields.error.flatten().fieldErrors);
        return {
            message: 'Validation failed. Please check the fields.',
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    // Include mobile in destructuring
    const { name, email, mobile, password, role } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

    try {
        // 2. Check if email OR mobile already exists
        // (Assuming mobile should also be unique, adjust if not)
        const existingUser = await sql`
            SELECT user_id, email, mobile_number FROM users WHERE email = ${email} OR mobile_number = ${mobile}
        `;

        const rowCount = existingUser?.rowCount ?? 0;
        if (rowCount > 0) {
            // Determine which field caused the conflict (simplified check)
            const row = existingUser?.rows?.[0];
            const isEmailConflict = row?.email === email;
            console.log(`Attempted sign up with existing ${isEmailConflict ? 'email' : 'mobile'}: ${isEmailConflict ? email : mobile}`);
            return {
                message: 'Sign up failed.',
                success: false,
                errors: isEmailConflict
                    ? { email: ['Email address is already in use.'] }
                    : { mobile: ['Mobile number is already in use.'] },
            };
        }

        // 3. Insert new user into the database (Added mobile_number column)
        await sql`
            INSERT INTO users (name, email, mobile_number, password_hash, role)
            VALUES (${name}, ${email}, ${mobile}, ${hashedPassword}, ${role})
        `;

        console.log("New user created successfully:", email, mobile, role);
        return { message: 'User created successfully! You can now log in.', success: true };

    } catch (error) {
        console.error('Database Error during sign up:', error);
        // Check for specific database errors if necessary
        if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
            // More robust check might be needed if multiple unique constraints exist
             return {
                message: 'Sign up failed.',
                success: false,
                errors: { _form: ['Email or Mobile number is already in use.'] }, // More generic error if specific check is hard
            };
        }
        return {
            message: 'Database Error: Failed to create user.',
            success: false,
            errors: { _form: ['An unexpected database error occurred.'] }
        };
    }
}

// Optional: Add a placeholder for a potential login action if needed in this file later
// export async function login(prevState: FormState | undefined, formData: FormData): Promise<FormState> {
//     // ... implementation using signIn from '@/auth' ...
// }