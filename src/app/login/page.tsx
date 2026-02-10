"use client";

import React, { useState, useActionState } from "react";
import { authenticate, signUp } from "@/src/app/auth/actions";
import { Wheat, Loader2, AlertCircle, UserPlus, LogIn } from "lucide-react";
import { useFormStatus } from "react-dom";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginError, dispatchLogin] = useActionState(authenticate, undefined);
  const [signupState, dispatchSignup] = useActionState(signUp, {
    message: "",
    success: false,
    errors: {},
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600 shadow-lg text-white">
          <Wheat className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Rudra Seeds
        </h1>
        <p className="text-slate-500 font-medium">
          {mode === "login" ? "Platform Access" : "Create New Account"}
        </p>
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        {mode === "login" && (
          <form action={dispatchLogin} className="space-y-4">
            <FloatingInput
              name="email"
              label="Email Address"
              type="email"
              placeholder="admin@rudra.com"
            />
            <FloatingInput
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
            />
            {loginError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 font-bold">
                <AlertCircle className="w-4 h-4" /> {loginError}
              </div>
            )}
            <SubmitButton text="Sign In" icon={LogIn} />
          </form>
        )}

        {mode === "signup" && (
          <form action={dispatchSignup} className="space-y-4">
            <FloatingInput
              name="name"
              label="Full Name"
              type="text"
              placeholder="John Doe"
              error={signupState.errors?.name?.[0]}
            />
            <FloatingInput
              name="email"
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              error={signupState.errors?.email?.[0]}
            />
            <FloatingInput
              name="mobile"
              label="Mobile Number"
              type="tel"
              placeholder="9876543210"
              error={signupState.errors?.mobile?.[0]}
            />
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">
                Role
              </label>
              <select
                name="role"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <FloatingInput
              name="password"
              label="Password"
              type="password"
              placeholder="Min 6 chars"
              error={signupState.errors?.password?.[0]}
            />
            {signupState.message && (
              <div
                className={`flex items-center gap-2 rounded-lg p-3 text-sm font-bold ${signupState.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}
              >
                <AlertCircle className="w-4 h-4" /> {signupState.message}
              </div>
            )}
            <SubmitButton text="Create Account" icon={UserPlus} />
          </form>
        )}

        <div className="mt-6 border-t border-slate-100 pt-6 text-center">
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-sm font-bold text-green-700 hover:underline"
          >
            {mode === "login" ? "Register Now" : "Back to Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FloatingInput({ name, label, type, placeholder, error }: any) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
        {label}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
      />
      {error && <p className="mt-1 text-xs text-red-500 font-bold">{error}</p>}
    </div>
  );
}

function SubmitButton({ text, icon: Icon }: any) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}{" "}
      {pending ? "Processing..." : text}
    </button>
  );
}
