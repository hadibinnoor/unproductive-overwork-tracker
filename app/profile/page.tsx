'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { supabaseBrowserClient } from "@/lib/supabaseClient";

type PersonaForm = {
  occupation: string;
  workMode: string;
  age: string;
  gender: string;
};

const occupationOptions = ["Student", "Employed", "Self-employed"];
const workModeOptions = ["Remote", "Hybrid", "In-person"];
const genderOptions = ["Male", "Female", "Other"];

export default function ProfilePage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [form, setForm] = useState<PersonaForm>({
    occupation: "",
    workMode: "",
    age: "",
    gender: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    const loadPersona = async (user: any) => {
      if (!user) {
        setErrorMessage("Please sign in to manage your profile.");
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email ?? null);
      setErrorMessage(null); // Clear any previous errors

      try {
        const { data, error: fetchError } = await supabaseBrowserClient
          .from("users")
          .select("occupation, work_mode, age, gender")
          .eq("id", user.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== "PGRST116") {
          // Don't show error if it's just that the user doesn't exist yet (new signup)
          if (fetchError.code !== "42P01") {
            console.error("Error loading persona:", fetchError);
          }
        } else if (data) {
          setForm({
            occupation: data.occupation ?? "",
            workMode: data.work_mode ?? "",
            age: data.age?.toString() ?? "",
            gender: data.gender ?? "",
          });
        }
      } catch (err) {
        console.error("Error fetching persona:", err);
      }

      setLoading(false);
    };

    // Check initial auth state
    const checkAuth = async () => {
      const { data: { session } } = await supabaseBrowserClient.auth.getSession();
      if (session?.user) {
        loadPersona(session.user);
        return;
      }
      
      // Try to get user even without session (for newly registered users)
      try {
        const { data: { user }, error } = await supabaseBrowserClient.auth.getUser();
        if (user && !error) {
          loadPersona(user);
          return;
        }
      } catch (err) {
        console.log("getUser() failed, checking sessionStorage:", err);
      }
      
      // Fallback: Check sessionStorage for user ID (from signup)
      const storedUserId = sessionStorage.getItem('wellsync_user_id');
      if (storedUserId) {
        // Create a minimal user object for the form
        const tempUser = { id: storedUserId, email: null };
        setUserId(storedUserId);
        setUserEmail(null);
        setErrorMessage(null);
        setLoading(false);
        // Try to load existing data if any
        try {
          const { data } = await supabaseBrowserClient
            .from("users")
            .select("occupation, work_mode, age, gender")
            .eq("id", storedUserId)
            .maybeSingle();
          if (data) {
            setForm({
              occupation: data.occupation ?? "",
              workMode: data.work_mode ?? "",
              age: data.age?.toString() ?? "",
              gender: data.gender ?? "",
            });
          }
        } catch (err) {
          // Ignore errors, user can still fill the form
        }
        return;
      }
      
      setErrorMessage("Please sign in to manage your profile.");
      setLoading(false);
    };

    checkAuth();

    // Listen to auth state changes
    const { data: { subscription } } = supabaseBrowserClient.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        loadPersona(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setUserEmail(null);
        setErrorMessage("Please sign in to manage your profile.");
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleChange = (field: keyof PersonaForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSignOut = async () => {
    await supabaseBrowserClient.auth.signOut();
    router.push("/");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) {
      setErrorMessage("Please sign in to manage your profile.");
      return;
    }

    setSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);

    // Try to get email from current session/user if not already set
    let email = userEmail;
    if (!email) {
      try {
        const { data: { user } } = await supabaseBrowserClient.auth.getUser();
        email = user?.email ?? null;
      } catch (err) {
        // Ignore, use null email
      }
    }

    const { error } = await supabaseBrowserClient.from("users").upsert(
      {
        id: userId,
        email: email,
        occupation: form.occupation,
        work_mode: form.workMode,
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
      },
      { onConflict: "id" }
    );

    if (error) {
      setErrorMessage(error.message ?? "Unable to save your profile. You may need to confirm your email first.");
      setSaving(false);
    } else {
      setStatusMessage("Profile saved successfully.");
      // Clear sessionStorage after successful save
      sessionStorage.removeItem('wellsync_user_id');
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white dark:from-gray-900 dark:via-slate-900 dark:to-black page-transition ${isMounted && !isExiting ? 'page-enter' : isExiting ? 'page-exit' : ''}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white text-lg">WellSync</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setIsExiting(true);
                setTimeout(() => router.push("/dashboard"), 200);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-white/40 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl p-8">
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 dark:border-indigo-800/70 px-4 py-1 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
            Digital Persona
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Complete your profile</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tell us about your work style so we can compare you with the right peer group and personalize your insights.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-gray-600 dark:text-gray-400">Loading your profile…</p>
        ) : !userId ? (
          <div className="text-center space-y-4 py-8">
            <p className="text-red-500">{errorMessage || "Please sign in to manage your profile."}</p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Occupation</label>
              <select
                value={form.occupation}
                onChange={handleChange("occupation")}
                className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="" disabled>
                  Select occupation
                </option>
                {occupationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Work mode</label>
              <select
                value={form.workMode}
                onChange={handleChange("workMode")}
                className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="" disabled>
                  Select work mode
                </option>
                {workModeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Age</label>
                <input
                  type="number"
                  min={16}
                  max={80}
                  value={form.age}
                  onChange={handleChange("age")}
                  className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g., 24"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                <select
                  value={form.gender}
                  onChange={handleChange("gender")}
                  className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="" disabled>
                    Select gender
                  </option>
                  {genderOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {errorMessage && (
              <p className="text-sm text-red-500" role="alert">
                {errorMessage}
              </p>
            )}
            {statusMessage && (
              <p className="text-sm text-green-600 dark:text-green-400" role="status">
                {statusMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-2xl transition-all hover:shadow-lg"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </form>
        )}
        </div>
      </main>
    </div>
  );
}

