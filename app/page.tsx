// app/page.tsx
"use client";

import React, { useState, useEffect, useActionState } from 'react';
import { signIn } from 'next-auth/react';
import { signUp, FormState as SignUpFormState } from '@/app/auth/actions';
import { Input, Select } from '@/components/ui/FormInputs';
import { LogIn, UserPlus, LoaderCircle, AlertCircle, Wheat } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // Keep useRouter
import Image from 'next/image';

const initialSignUpState: SignUpFormState = { message: '', success: false, errors: {} };

export default function AuthPage() {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const { data: session, status } = useSession();
    const router = useRouter();

    // --- Time-based Welcome Message ---
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setWelcomeMessage('Good Morning!');
        else if (hour < 18) setWelcomeMessage('Good Afternoon!');
        else setWelcomeMessage('Good Evening!');
    }, []);

    // --- Redirect if already logged in ---
    // This useEffect now handles redirection BOTH on initial load AND after successful login (triggered by router.refresh())
    useEffect(() => {
        // Only redirect if authentication status is confirmed and session/user object exists
        if (status === 'authenticated' && session?.user?.role) {
            console.log(`User authenticated (${session.user.role}). Redirecting...`);
            const targetDashboard = session.user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
            router.replace(targetDashboard); // Use replace to avoid adding login page to browser history
        } else if (status === 'authenticated' && !session?.user?.role) {
             // Handle edge case where session exists but role might be missing (shouldn't happen with our callbacks)
             console.error("Authenticated user session is missing role. Logging out.");
             // Optionally sign out the user here if the session state is invalid
             // signOut({ callbackUrl: '/' });
        }
    }, [status, session, router]);

    // --- Loading State Check ---
    // Show loading indicator ONLY while session status is initially loading
    if (status === 'loading') {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-primary-container via-surface to-secondary-container">
                <LoaderCircle className="w-12 h-12 text-primary animate-spin" />
                <p className="mt-4 text-on-surface-variant">Checking session...</p>
            </main>
        );
    }

     // If authenticated, don't render the form while redirecting
     if (status === 'authenticated') {
         return ( // Show a minimal message during the redirect phase
             <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-primary-container via-surface to-secondary-container">
                 <LoaderCircle className="w-12 h-12 text-primary animate-spin" />
                 <p className="mt-4 text-on-surface-variant">Redirecting...</p>
             </main>
         );
     }

    // --- Render Login/Sign Up Form if status is 'unauthenticated' ---
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-primary-container via-surface to-secondary-container">
            <div className="w-full max-w-md bg-surface rounded-3xl shadow-xl p-8 border border-outline/20 transform transition-all duration-300 ease-out">
                {/* Logo and Welcome */}
                <div className="flex flex-col items-center mb-6 text-center">
                    <Image
                        src="/rudra-seeds-logo.svg"
                        alt="RudraSeeds Logo"
                        width={64}
                        height={64}
                        className="mb-3 transition-transform hover:scale-105"
                        priority
                    />
                    <h1 className="text-2xl font-medium text-on-surface mb-1">RudraSeeds</h1>
                    <p className="text-on-surface-variant">{welcomeMessage}</p>
                </div>

                {/* Tab Buttons */}
                <div className="flex mb-6 bg-surface-container p-1 rounded-full border border-outline/30">
                     <TabButton isActive={mode === 'login'} onClick={() => setMode('login')}>
                        Log In
                    </TabButton>
                     <TabButton isActive={mode === 'signup'} onClick={() => setMode('signup')}>
                        Sign Up
                    </TabButton>
                </div>

                {/* Conditional Form Rendering */}
                {mode === 'login' ? <LoginForm /> : <SignUpForm setMode={setMode} />}
            </div>
        </main>
    );
}

// --- Login Form Component ---
function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter(); // Use router for refresh

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const result = await signIn('credentials', { redirect: false, email, password });
            setIsLoading(false); // Stop loading indicator regardless of outcome

            if (result?.error) {
                console.error("SignIn Error:", result.error);
                setError('Invalid email or password.');
            } else if (result?.ok && !result.error) {
                console.log('Login successful, refreshing session...');
                // Refresh the current route. This allows the useSession hook in the
                // parent component to pick up the new session state and trigger the redirect useEffect.
                router.refresh();
                // We keep setIsLoading(true) after refresh potentially,
                // because the parent component will show loading during redirect.
                setIsLoading(true); // Show loading until redirect happens
            } else {
                 setError('Login failed. Please try again.');
            }
        } catch (err) {
            setIsLoading(false);
            console.error("SignIn Catch Error:", err);
            setError('An unexpected error occurred.');
        }
    };

    // Rest of LoginForm remains the same...
    return (
        <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn">
            <Input
                id="login-email" name="email" type="email" label="Email Address"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required disabled={isLoading} autoComplete="email"
            />
            <Input
                id="login-password" name="password" type="password" label="Password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required disabled={isLoading} autoComplete="current-password"
            />
            <FormErrorMessage error={error} />
            <SubmitButton isLoading={isLoading} icon={LogIn} text="Log In" />
        </form>
    );
}

// --- SignUpForm Component (remains the same) ---
function SignUpForm({ setMode }: { setMode: (mode: 'login' | 'signup') => void }) {
    const [state, formAction] = useActionState(signUp, initialSignUpState);
    const [pending, startTransition] = React.useTransition();

    useEffect(() => {
        if (state?.success) {
            alert(state.message);
            setMode('login');
        }
    }, [state, setMode]);

    // Rest of SignUpForm remains the same...
     return (
        <form action={(formData) => startTransition(() => formAction(formData))} className="space-y-5 animate-fadeIn">
             <Input
                id="signup-name" name="name" type="text" label="Full Name"
                required disabled={pending} autoComplete="name"
                aria-describedby="name-error"
            />
             <FieldError errors={state?.errors?.name} id="name-error" />

            <Input
                id="signup-email" name="email" type="email" label="Email Address"
                required disabled={pending} autoComplete="email"
                aria-describedby="email-error"
            />
             <FieldError errors={state?.errors?.email} id="email-error" />

            <Input
                id="signup-mobile" name="mobile" type="tel" label="Mobile Number (10 digits)"
                inputMode="numeric" pattern="[0-9]{10}" maxLength={10}
                required disabled={pending} autoComplete="tel"
                aria-describedby="mobile-error"
             />
             <FieldError errors={state?.errors?.mobile} id="mobile-error" />

            <Input
                id="signup-password" name="password" type="password" label="Password (min. 6 chars)"
                required disabled={pending} autoComplete="new-password"
                aria-describedby="password-error"
            />
            <FieldError errors={state?.errors?.password} id="password-error" />

            <Select id="signup-role" name="role" label="Role" required disabled={pending} defaultValue="" aria-describedby="role-error">
                <option value="" disabled hidden>Select your role...</option>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
            </Select>
            <FieldError errors={state?.errors?.role} id="role-error" />

            <FormErrorMessage error={state?.errors?._form?.[0] || (!state?.success ? state?.message : '')} />

            <SubmitButton isLoading={pending} icon={UserPlus} text="Sign Up" />
        </form>
    );
}

// --- UI Helper Components (remain the same) ---
const TabButton = ({ isActive, onClick, children }: { isActive: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button type="button" onClick={onClick} className={`flex-1 py-3 px-4 rounded-full font-medium text-center transition-all duration-300 ease-in-out text-sm sm:text-base ${ isActive ? 'bg-primary text-on-primary shadow-md transform scale-105' : 'text-on-surface-variant hover:bg-primary/10' }`} > {children} </button>
);
const SubmitButton = ({ isLoading, icon: Icon, text }: { isLoading: boolean, icon: React.ElementType, text: string }) => (
     <button type="submit" disabled={isLoading} className="w-full h-[50px] text-base font-medium rounded-full bg-primary text-on-primary shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-on-surface/20 disabled:text-on-surface/40 disabled:shadow-none disabled:cursor-not-allowed" > {isLoading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />} {isLoading ? 'Processing...' : text} </button>
);
const FormErrorMessage = ({ error }: { error: string | null | undefined }) => {
    if (!error) return null;
    return ( <div className="flex items-center gap-2 text-sm text-error bg-error-container p-3 rounded-lg mt-1"> <AlertCircle className="w-5 h-5 flex-shrink-0" /> <p>{error}</p> </div> );
};
const FieldError = ({ errors, id }: { errors?: string[], id: string }) => {
    if (!errors || errors.length === 0) return null;
    return ( <div id={id} aria-live="polite" aria-atomic="true"> {errors.map((error: string) => ( <p className="mt-1 text-xs text-error px-1" key={error}> {error} </p> ))} </div> );
};

// --- Animation Styles (remain the same) ---
const styles = ` @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; } `;
if (typeof window !== 'undefined') { const styleSheet = document.createElement("style"); styleSheet.type = "text/css"; styleSheet.innerText = styles; document.head.appendChild(styleSheet); }