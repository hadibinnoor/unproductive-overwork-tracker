'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { supabaseBrowserClient } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<"signup" | "signin">("signup");
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [signinForm, setSigninForm] = useState({
    email: "",
    password: "",
  });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signinLoading, setSigninLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signinError, setSigninError] = useState<string | null>(null);

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignupLoading(true);
    setSignupError(null);

    const { data, error } = await supabaseBrowserClient.auth.signUp({
      email: signupForm.email,
      password: signupForm.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: signupForm.fullName,
        },
      },
    });

    if (error) {
      setSignupError(error.message);
      setSignupLoading(false);
    } else if (data.user?.identities?.length === 0) {
      setSignupError("Account already exists with this email.");
      setSignupLoading(false);
    } else if (data.user) {
      // Store user ID in sessionStorage as fallback
      if (data.user.id) {
        sessionStorage.setItem('wellsync_user_id', data.user.id);
      }
      
      // Check if we have a session immediately (email confirmation disabled)
      if (data.session) {
        // User is signed in immediately, redirect to profile
        console.log("Session available immediately, redirecting to profile");
        router.push("/profile");
      } else {
        // Email confirmation might be required
        // Wait a bit and check for session, or try to sign in with the same credentials
        console.log("No session immediately, checking after delay...");
        
        // Try to get session after a brief delay
        setTimeout(async () => {
          const { data: { session } } = await supabaseBrowserClient.auth.getSession();
          if (session) {
            console.log("Session found after delay, redirecting");
            router.push("/profile");
          } else {
            // If still no session, try to sign in with the same credentials
            // This handles cases where email confirmation is disabled but session wasn't created
            console.log("No session found, attempting sign in...");
            const { data: signInData, error: signInError } = await supabaseBrowserClient.auth.signInWithPassword({
              email: signupForm.email,
              password: signupForm.password,
            });
            
            if (signInError) {
              console.error("Sign in error:", signInError);
              // Still redirect - profile page will handle it with sessionStorage fallback
              router.push("/profile");
            } else if (signInData.session) {
              console.log("Successfully signed in, redirecting");
              router.push("/profile");
            } else {
              // Redirect anyway - profile page will use sessionStorage
              router.push("/profile");
            }
          }
        }, 500);
      }
    } else {
      setSignupLoading(false);
    }
  };

  const handleSignin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSigninLoading(true);
    setSigninError(null);

    const { data, error } = await supabaseBrowserClient.auth.signInWithPassword({
      email: signinForm.email,
      password: signinForm.password,
    });

    if (error) {
      setSigninError(error.message);
      setSigninLoading(false);
    } else if (data.session) {
      setSigninError(null);
      // Redirect to dashboard after successful sign-in
      router.push("/dashboard");
    } else {
      setSigninLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-white dark:from-gray-900 dark:via-slate-900 dark:to-black flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/70 dark:bg-gray-900/70 border border-white/40 dark:border-gray-800 shadow">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
              W
            </div>
            <span className="text-sm font-semibold tracking-wide text-indigo-600 dark:text-indigo-300">
              WellSync
            </span>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Access your wellness workspace
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Create an account or sign back in—use the switch below to move between forms.
          </p>
        </div>

        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/40 dark:border-gray-800">
          <div className="flex rounded-2xl bg-gray-100 dark:bg-gray-800 p-1 mb-10">
            {["signup", "signin"].map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view as "signup" | "signin")}
                className={`w-1/2 rounded-2xl py-3 text-sm font-semibold transition-all ${
                  activeView === view
                    ? "bg-white dark:bg-gray-900 shadow text-indigo-600 dark:text-indigo-300"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {view === "signup" ? "Create account" : "Sign in"}
              </button>
            ))}
          </div>

          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                width: "200%",
                transform: activeView === "signup" ? "translateX(0%)" : "translateX(-50%)",
              }}
            >
              {/* Sign Up */}
              <form className="w-full space-y-6 pr-6" onSubmit={handleSignup}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={signupForm.fullName}
                    onChange={(event) =>
                      setSignupForm((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Alex Morgan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Work email
                  </label>
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(event) =>
                      setSignupForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="alex@company.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={signupForm.password}
                    onChange={(event) =>
                      setSignupForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Create a strong password"
                    required
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                  <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    I agree to the Terms & Privacy.
                  </label>
                  <Link href="/legal" className="text-indigo-600 hover:text-indigo-500 text-right">
                    View policies
                  </Link>
                </div>
                <button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-2xl transition-all hover:shadow-lg"
                >
                  {signupLoading ? "Creating..." : "Create account"}
                </button>
                {signupError && (
                  <p className="text-sm text-red-500" role="alert">
                    {signupError}
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Already using WellSync? Flip the toggle to sign in or head to the{" "}
                  <Link href="/signin" className="text-indigo-600 hover:text-indigo-500 font-medium">
                    dedicated sign in page
                  </Link>
                  .
                </p>
              </form>

              {/* Sign In */}
              <form className="w-full space-y-6 pl-6" onSubmit={handleSignin}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={signinForm.email}
                    onChange={(event) =>
                      setSigninForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="you@company.com"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">
                      Forgot?
                    </Link>
                  </div>
                  <input
                    type="password"
                    value={signinForm.password}
                    onChange={(event) =>
                      setSigninForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={signinLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-2xl transition-all hover:shadow-lg"
                >
                  {signinLoading ? "Signing in..." : "Continue"}
                </button>
                {signinError && (
                  <p className="text-sm text-red-500" role="alert">
                    {signinError}
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Need SSO, passkey, or a magic link? Jump to the full{" "}
                  <Link href="/signin" className="text-indigo-600 hover:text-indigo-500 font-medium">
                    WellSync sign in page
                  </Link>
                  .
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

