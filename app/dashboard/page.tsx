'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { supabaseBrowserClient } from "@/lib/supabaseClient";

type CheckinForm = {
  sleepHours: string;
  sleepQuality: string;
  exerciseMinutes: string;
  socialHours: string;
  leisureScreenHours: string;
  workScreenHours: string;
  stressLevel: string;
  mentalWellness: string;
};

type UserProfile = {
  age: number | null;
  gender: string | null;
  occupation: string | null;
  work_mode: string | null;
};

type DashboardData = {
  recentCheckIns: any[];
  todayCheckIn: any | null;
  weekStats: {
    avgRisk: number;
    avgSleep: number;
    totalCheckIns: number;
  };
  peerBenchmark: any | null;
  userProfile: UserProfile | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  const [form, setForm] = useState<CheckinForm>({
    sleepHours: "7",
    sleepQuality: "3",
    exerciseMinutes: "0",
    socialHours: "0",
    leisureScreenHours: "0",
    workScreenHours: "8",
    stressLevel: "5",
    mentalWellness: "50",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [riskResult, setRiskResult] = useState<any>(null);
  const [peerBenchmark, setPeerBenchmark] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [hasCheckedToday, setHasCheckedToday] = useState(false);
  const [userDismissedCheckin, setUserDismissedCheckin] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      const {
        data: { user },
      } = await supabaseBrowserClient.auth.getUser();
      if (user) {
        const { data } = await supabaseBrowserClient
          .from("users")
          .select("age, gender, occupation, work_mode")
          .eq("id", user.id)
          .single();
        if (data) {
          setUserProfile({
            age: data.age,
            gender: data.gender,
            occupation: data.occupation,
            work_mode: data.work_mode,
          });
        }
      }
    };
    if (showCheckin) {
      loadUserProfile();
    }
  }, [showCheckin]);

  // Check for today's check-in on dashboard load
  useEffect(() => {
    const checkTodayCheckin = async () => {
      // Only check once per page load
      if (hasCheckedToday) return;

      const {
        data: { user },
      } = await supabaseBrowserClient.auth.getUser();
      
      if (!user) {
        // Not signed in, redirect to signup
        router.push("/signup");
        return;
      }

      // Check if user has a check-in today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: checkIns, error } = await supabaseBrowserClient
        .from("check_ins")
        .select("id, created_at")
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString())
        .lt("created_at", tomorrow.toISOString())
        .limit(1);

      if (error) {
        console.error("Error checking today's check-in:", error);
        setHasCheckedToday(true);
        return;
      }

      // If no check-in for today and user hasn't dismissed it, auto-open the form
      if (!checkIns || checkIns.length === 0) {
        // Small delay to ensure UI is ready
        setTimeout(() => {
          if (!userDismissedCheckin) {
            setShowCheckin(true);
          }
        }, 500);
      }
      
      setHasCheckedToday(true);
    };

    checkTodayCheckin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      const {
        data: { user },
      } = await supabaseBrowserClient.auth.getUser();
      
      if (!user) {
        setDashboardLoading(false);
        return;
      }

      try {
        // Get last 7 days of check-ins
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentCheckIns, error: checkInsError } = await supabaseBrowserClient
          .from("check_ins")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", sevenDaysAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(7);

        if (checkInsError) {
          console.error("Error loading check-ins:", checkInsError);
          setDashboardLoading(false);
          return;
        }

        // Get today's check-in
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayCheckIn = recentCheckIns?.find(
          (c) => new Date(c.created_at) >= today && new Date(c.created_at) < tomorrow
        ) || null;

        // Calculate week stats
        const avgRisk = recentCheckIns?.length
          ? recentCheckIns.reduce((sum, c) => sum + (c.calculated_risk_score || 0), 0) / recentCheckIns.length
          : 0;
        
        const avgSleep = recentCheckIns?.length
          ? recentCheckIns.reduce((sum, c) => sum + (c.sleep_hours || 0), 0) / recentCheckIns.length
          : 0;

        // Get user profile
        const { data: profile } = await supabaseBrowserClient
          .from("users")
          .select("age, gender, occupation, work_mode")
          .eq("id", user.id)
          .single();

        // Get peer benchmark if profile exists
        let peerData = null;
        if (profile?.occupation && profile?.work_mode) {
          const { data: benchmarkData } = await supabaseBrowserClient
            .from("persona_benchmarks")
            .select("*")
            .eq("occupation", profile.occupation)
            .eq("work_mode", profile.work_mode)
            .maybeSingle();
          peerData = benchmarkData;
        }

        setDashboardData({
          recentCheckIns: recentCheckIns || [],
          todayCheckIn,
          weekStats: {
            avgRisk: Math.round(avgRisk),
            avgSleep: parseFloat(avgSleep.toFixed(1)),
            totalCheckIns: recentCheckIns?.length || 0,
          },
          peerBenchmark: peerData,
          userProfile: profile ? {
            age: profile.age,
            gender: profile.gender,
            occupation: profile.occupation,
            work_mode: profile.work_mode,
          } : null,
        });
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setDashboardLoading(false);
      }
    };

    loadDashboardData();
  }, []);


  const handleSignOut = async () => {
    await supabaseBrowserClient.auth.signOut();
    router.push("/");
  };

  const handleChange = (field: keyof CheckinForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if not on the last step
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      return;
    }
    
    if (!userProfile) {
      setError("Please complete your profile first.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const {
        data: { user },
      } = await supabaseBrowserClient.auth.getUser();
      if (!user) {
        setError("Please sign in to submit check-in.");
        setSubmitting(false);
        return;
      }

      // Calculate screen_time_hours (work + leisure)
      const workScreen = parseFloat(form.workScreenHours) || 0;
      const leisureScreen = parseFloat(form.leisureScreenHours) || 0;
      const screenTimeHours = workScreen + leisureScreen;

      // Prepare API payload
      const apiPayload = {
        age: userProfile.age || 25,
        gender: userProfile.gender || "Other",
        occupation: userProfile.occupation || "Employed",
        work_mode: userProfile.work_mode || "Remote",
        screen_time_hours: screenTimeHours,
        work_screen_hours: workScreen,
        leisure_screen_hours: leisureScreen,
        sleep_hours: parseFloat(form.sleepHours) || 7,
        sleep_quality_1_5: parseInt(form.sleepQuality) || 3,
        stress_level_0_10: parseInt(form.stressLevel) || 5,
        exercise_minutes_per_week: parseInt(form.exerciseMinutes) || 0,
        social_hours_per_week: parseFloat(form.socialHours) || 0,
        mental_wellness_index_0_100: parseInt(form.mentalWellness) || 50,
      };

      console.log("API Payload being sent:", apiPayload);

      // Call risk API through Next.js API route (avoids CORS issues)
      const apiUrl = "/api/predict-risk";
      console.log("Calling API at:", apiUrl);
      
      let response;
      let errorResponse;
      
      try {
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiPayload),
        });

        if (!response.ok) {
          // Try to get error details from response
          try {
            errorResponse = await response.json();
          } catch {
            const textResponse = await response.text();
            errorResponse = { error: textResponse || "Unknown error" };
          }
          
          console.error("API Error Response:", {
            status: response.status,
            statusText: response.statusText,
            body: errorResponse,
          });
          
          throw new Error(
            `API error (${response.status}): ${errorResponse?.error || errorResponse?.message || response.statusText || "Bad Request"}`
          );
        }
      } catch (fetchError: any) {
        console.error("Fetch error details:", {
          name: fetchError.name,
          message: fetchError.message,
        });
        
        // Handle network errors
        if (fetchError.name === "TypeError" || fetchError.message.includes("fetch") || fetchError.message.includes("Failed to fetch")) {
          throw new Error(
            `Unable to connect to the risk API. Please check if the API server is running and the URL is correct in your .env.local file.`
          );
        }
        throw fetchError;
      }

      const riskData = await response.json();
      console.log("Risk API response:", riskData);

      // Extract risk score from various possible field names
      const riskScore = riskData.risk_percentage || riskData.risk_score || riskData.risk || riskData.predicted_risk || riskData.burnout_risk || null;
      
      // Check if user already has a check-in for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: existingCheckIns, error: checkError } = await supabaseBrowserClient
        .from("check_ins")
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString())
        .lt("created_at", tomorrow.toISOString())
        .limit(1);

      if (checkError) {
        console.error("Error checking existing check-ins:", checkError);
        throw new Error(`Failed to check existing check-ins: ${checkError.message}`);
      }

      // Prepare check-in data
      const checkInData = {
        user_id: user.id,
        sleep_hours: apiPayload.sleep_hours,
        sleep_quality_1_5: apiPayload.sleep_quality_1_5,
        exercise_minutes_per_week: apiPayload.exercise_minutes_per_week,
        social_hours_per_week: apiPayload.social_hours_per_week,
        leisure_screen_hours: apiPayload.leisure_screen_hours,
        calculated_risk_score: riskScore,
      };

      console.log("Saving check-in data:", checkInData);

      let savedData;
      let dbError;

      // If check-in exists for today, update it; otherwise insert new one
      if (existingCheckIns && existingCheckIns.length > 0) {
        const { data: updatedData, error: updateError } = await supabaseBrowserClient
          .from("check_ins")
          .update(checkInData)
          .eq("id", existingCheckIns[0].id)
          .select();

        savedData = updatedData;
        dbError = updateError;
        console.log("Check-in updated successfully:", savedData);
      } else {
        const { data: insertedData, error: insertError } = await supabaseBrowserClient
          .from("check_ins")
          .insert(checkInData)
          .select();

        savedData = insertedData;
        dbError = insertError;
        console.log("Check-in saved successfully:", savedData);
      }

      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error(`Failed to save check-in: ${dbError.message}`);
      }

      // Store results and show them
      setRiskResult({
        riskScore: riskScore,
        actionableInsight: riskData.actionable_insight || riskData.insight || riskData.recommendation || null,
      });
      
      // Fetch peer benchmark data
      if (userProfile?.occupation && userProfile?.work_mode) {
        try {
          const { data: peerData, error: peerError } = await supabaseBrowserClient
            .from("persona_benchmarks")
            .select("*")
            .eq("occupation", userProfile.occupation)
            .eq("work_mode", userProfile.work_mode)
            .maybeSingle();
          
          if (!peerError && peerData) {
            setPeerBenchmark(peerData);
            console.log("Peer benchmark data loaded:", peerData);
          } else {
            console.log("No peer benchmark data found for this persona");
            setPeerBenchmark(null);
          }
        } catch (peerErr) {
          console.error("Error fetching peer benchmark:", peerErr);
          setPeerBenchmark(null);
        }
      }
      
      // Mark that user has checked in today
      setHasCheckedToday(true);
      
      // Close check-in modal and show results
      setShowCheckin(false);
      setShowResults(true);
      setSuccess(true);
      
      // Reload dashboard data
      setTimeout(async () => {
        const {
          data: { user: currentUser },
        } = await supabaseBrowserClient.auth.getUser();
        
        if (currentUser) {
          // Reload dashboard
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const { data: recentCheckIns } = await supabaseBrowserClient
            .from("check_ins")
            .select("*")
            .eq("user_id", currentUser.id)
            .gte("created_at", sevenDaysAgo.toISOString())
            .order("created_at", { ascending: false })
            .limit(7);

          if (recentCheckIns) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todayCheckIn = recentCheckIns.find(
              (c) => new Date(c.created_at) >= today && new Date(c.created_at) < tomorrow
            ) || null;

            const avgRisk = recentCheckIns.length
              ? recentCheckIns.reduce((sum, c) => sum + (c.calculated_risk_score || 0), 0) / recentCheckIns.length
              : 0;
            
            const avgSleep = recentCheckIns.length
              ? recentCheckIns.reduce((sum, c) => sum + (c.sleep_hours || 0), 0) / recentCheckIns.length
              : 0;

            setDashboardData((prev) => ({
              ...prev,
              recentCheckIns: recentCheckIns,
              todayCheckIn,
              weekStats: {
                avgRisk: Math.round(avgRisk),
                avgSleep: parseFloat(avgSleep.toFixed(1)),
                totalCheckIns: recentCheckIns.length,
              },
              peerBenchmark: prev?.peerBenchmark || null,
              userProfile: prev?.userProfile || null,
            }));
          }
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to submit check-in. Please try again.");
    } finally {
      setSubmitting(false);
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
                setTimeout(() => router.push("/history"), 200);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              History
            </button>
            <button
              onClick={() => {
                setIsExiting(true);
                setTimeout(() => router.push("/profile"), 200);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
            <button
              onClick={() => {
                setUserDismissedCheckin(false);
                setShowCheckin(true);
              }}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors"
            >
              Daily Check-in
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Welcome to your wellness workspace
          </p>
        </div>

        {dashboardLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading your dashboard...</p>
          </div>
        ) : !dashboardData || dashboardData.recentCheckIns.length === 0 ? (
          /* Empty State */
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/40 dark:border-gray-800 text-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Start Your Wellness Journey</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Complete your first daily check-in to see your wellness insights and track your progress over time.
            </p>
            <button
              onClick={() => {
                setUserDismissedCheckin(false);
                setShowCheckin(true);
              }}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold transition-colors shadow-lg hover:shadow-xl"
            >
              Complete Daily Check-in
            </button>
          </div>
        ) : (
          /* Dashboard Content */
          <div className="space-y-8">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Today's Check-in Status */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-indigo-100 dark:border-indigo-800/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  {dashboardData.todayCheckIn ? (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                      ✓ Completed
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-full">
                      Pending
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Today's Check-in</h3>
                {dashboardData.todayCheckIn ? (
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {dashboardData.todayCheckIn.calculated_risk_score || 0}%
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Risk Score</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    Complete your daily check-in to track your wellness
                  </p>
                )}
              </div>

              {/* 7-Day Average Risk */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-orange-100 dark:border-orange-800/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    dashboardData.weekStats.avgRisk < 30
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : dashboardData.weekStats.avgRisk < 60
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>
                    {dashboardData.weekStats.avgRisk < 30 ? 'Low' : dashboardData.weekStats.avgRisk < 60 ? 'Moderate' : 'High'}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">7-Day Avg Risk</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.weekStats.avgRisk}%</p>
              </div>

              {/* 7-Day Average Sleep */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-blue-100 dark:border-blue-800/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    dashboardData.weekStats.avgSleep >= 7
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : dashboardData.weekStats.avgSleep >= 6
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>
                    {dashboardData.weekStats.avgSleep >= 7 ? 'Good' : dashboardData.weekStats.avgSleep >= 6 ? 'Fair' : 'Poor'}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">7-Day Avg Sleep</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.weekStats.avgSleep}h</p>
              </div>
            </div>

            {/* 7-Day Trend Chart */}
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/40 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">7-Day Burnout Risk Trend</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Track your wellness journey over the past week</p>
                </div>
                <button
                  onClick={() => router.push("/history")}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                >
                  View All History →
                </button>
              </div>

              {/* Enhanced Line Chart */}
              {dashboardData.recentCheckIns.length > 1 ? (
                <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl overflow-hidden p-3">
                  {/* Y-axis labels */}
                  <div className="absolute left-2 top-3 bottom-3 w-10 flex flex-col justify-between text-[10px] font-medium text-gray-600 dark:text-gray-400 text-right pr-2">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>

                  {/* Chart area with left margin */}
                  <div className="absolute left-14 right-6 top-3 bottom-3">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="border-t border-gray-200 dark:border-gray-700/50"></div>
                      ))}
                    </div>

                    {/* Data visualization */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {/* Area under curve */}
                      <defs>
                        <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" style={{ stopColor: 'rgb(239, 68, 68)', stopOpacity: 0.3 }} />
                          <stop offset="100%" style={{ stopColor: 'rgb(239, 68, 68)', stopOpacity: 0.05 }} />
                        </linearGradient>
                      </defs>
                      
                      {/* Fill area */}
                      <polygon
                        fill="url(#redGradient)"
                        points={`0,100 ${dashboardData.recentCheckIns
                          .slice()
                          .reverse()
                          .map((item, index) => {
                            const x = (index / (dashboardData.recentCheckIns.length - 1)) * 100;
                            const y = 100 - (item.calculated_risk_score || 0);
                            return `${x},${y}`;
                          })
                          .join(" ")} 100,100`}
                      />

                      {/* Red Line */}
                      <polyline
                        fill="none"
                        stroke="rgb(239, 68, 68)"
                        strokeWidth="0.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        points={dashboardData.recentCheckIns
                          .slice()
                          .reverse()
                          .map((item, index) => {
                            const x = (index / (dashboardData.recentCheckIns.length - 1)) * 100;
                            const y = 100 - (item.calculated_risk_score || 0);
                            return `${x},${y}`;
                          })
                          .join(" ")}
                      />
                    </svg>

                    {/* Data points overlay */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {dashboardData.recentCheckIns
                        .slice()
                        .reverse()
                        .map((item, index) => {
                          const x = (index / (dashboardData.recentCheckIns.length - 1)) * 100;
                          const y = 100 - (item.calculated_risk_score || 0);
                          const riskScore = item.calculated_risk_score || 0;
                          return (
                            <g key={item.id}>
                              <circle
                                cx={`${x}%`}
                                cy={`${y}%`}
                                r="5"
                                fill="white"
                                stroke="rgb(239, 68, 68)"
                                strokeWidth="2.5"
                                className="drop-shadow-md pointer-events-auto cursor-pointer hover:r-7 transition-all"
                              />
                              <title>
                                {new Date(item.created_at).toLocaleDateString()}: {riskScore}% Risk
                                {"\n"}Sleep: {item.sleep_hours}h
                                {"\n"}Exercise: {item.exercise_minutes_per_week}min
                              </title>
                            </g>
                          );
                        })}
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                  <p className="text-gray-500 dark:text-gray-400">Complete more check-ins to see your trend</p>
                </div>
              )}

              {/* X-axis dates */}
              {dashboardData.recentCheckIns.length > 1 && (
                <div className="flex justify-between mt-4 text-xs font-medium text-gray-600 dark:text-gray-400 px-4">
                  <span>{new Date(dashboardData.recentCheckIns[dashboardData.recentCheckIns.length - 1].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span>{new Date(dashboardData.recentCheckIns[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              )}
            </div>

            {/* Peer Group Benchmarking - Section Header */}
            {dashboardData.peerBenchmark && dashboardData.userProfile && (
              <>
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Peer Group Benchmarking</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Comparing with <span className="font-semibold text-indigo-600 dark:text-indigo-400">{dashboardData.peerBenchmark.count} {dashboardData.userProfile.work_mode} {dashboardData.userProfile.occupation}s</span>
                  </p>
                </div>

                {/* Burnout Risk Gauge */}
                <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-900/10 dark:via-orange-900/10 dark:to-yellow-900/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-red-100 dark:border-red-800/30">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Burnout Risk Assessment</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your current risk level vs peer average</p>
                    </div>
                    <div className="px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400">HIGH PRIORITY</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Gauge Chart */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-64 h-64">
                        <svg className="w-full h-full" viewBox="0 0 200 200">
                          {/* Background arc */}
                          <path
                            d="M 30,100 A 70,70 0 1,1 170,100"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="20"
                            strokeLinecap="round"
                            className="text-gray-200 dark:text-gray-700"
                          />
                          
                          {/* Risk arc with correct percentage */}
                          <path
                            d="M 30,100 A 70,70 0 1,1 170,100"
                            fill="none"
                            stroke="url(#gaugeGradient)"
                            strokeWidth="20"
                            strokeLinecap="round"
                            strokeDasharray="219.91"
                            strokeDashoffset={219.91 * (1 - dashboardData.weekStats.avgRisk / 100)}
                            className="transition-all duration-1000"
                          />
                          
                          <defs>
                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="rgb(34, 197, 94)" />
                              <stop offset="50%" stopColor="rgb(234, 179, 8)" />
                              <stop offset="100%" stopColor="rgb(239, 68, 68)" />
                            </linearGradient>
                          </defs>
                        </svg>
                        
                        {/* Center content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-5xl font-bold text-gray-900 dark:text-white">{dashboardData.weekStats.avgRisk}%</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your Risk</span>
                        </div>
                      </div>
                      
                      {/* Risk Level Label */}
                      <div className="mt-4 text-center">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                          dashboardData.weekStats.avgRisk < 30
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : dashboardData.weekStats.avgRisk < 60
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}>
                          {dashboardData.weekStats.avgRisk < 30 ? '✓ Low Risk' : dashboardData.weekStats.avgRisk < 60 ? '⚠ Moderate Risk' : '🚨 High Risk'}
                        </span>
                      </div>
                    </div>

                    {/* Comparison Stats */}
                    <div className="space-y-6">
                      <div className="bg-white/60 dark:bg-gray-900/60 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900 dark:text-white">You vs Peers</h4>
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600 dark:text-gray-400">Your Burnout Risk</span>
                              <span className="font-bold text-gray-900 dark:text-white">{dashboardData.weekStats.avgRisk}%</span>
                            </div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  dashboardData.weekStats.avgRisk < 30 ? 'bg-green-500' : dashboardData.weekStats.avgRisk < 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${dashboardData.weekStats.avgRisk}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600 dark:text-gray-400">Peer Average</span>
                              <span className="font-bold text-gray-900 dark:text-white">{((dashboardData.peerBenchmark.avg_stress / 10) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 transition-all duration-500"
                                style={{ width: `${(dashboardData.peerBenchmark.avg_stress / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-center bg-white/60 dark:bg-gray-900/60 rounded-lg py-3 px-4">
                            <div className={`text-4xl font-bold mb-1 ${
                              dashboardData.weekStats.avgRisk < (dashboardData.peerBenchmark.avg_stress / 10) * 100
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-orange-600 dark:text-orange-400'
                            }`}>
                              {Math.abs(dashboardData.weekStats.avgRisk - (dashboardData.peerBenchmark.avg_stress / 10) * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {dashboardData.weekStats.avgRisk < (dashboardData.peerBenchmark.avg_stress / 10) * 100
                                ? "better than your peer group"
                                : "higher than peers"
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/60 dark:bg-gray-900/60 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.weekStats.avgSleep}h</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avg Sleep</div>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-900/60 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.weekStats.totalCheckIns}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Check-ins</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Productivity & Wellness Cards - Separated */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Productivity Index Card */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-green-100 dark:border-green-800/30">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Productivity Index</h3>
                      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Your Estimated Score</span>
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            {Math.max(0, Math.min(100, 100 - dashboardData.weekStats.avgRisk)).toFixed(0)}
                          </span>
                        </div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${Math.max(0, 100 - dashboardData.weekStats.avgRisk)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Peer Average</span>
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            {dashboardData.peerBenchmark.avg_productivity.toFixed(0)}
                          </span>
                        </div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${dashboardData.peerBenchmark.avg_productivity}%` }}
                          />
                        </div>
                      </div>
                      <div className="pt-4 border-t border-green-200 dark:border-green-800">
                        <div className="text-center bg-white/60 dark:bg-gray-900/60 rounded-lg py-3 px-4 mb-2">
                          <div className={`text-4xl font-bold mb-1 ${
                            (100 - dashboardData.weekStats.avgRisk) > dashboardData.peerBenchmark.avg_productivity
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-orange-600 dark:text-orange-400'
                          }`}>
                            {Math.abs((100 - dashboardData.weekStats.avgRisk) - dashboardData.peerBenchmark.avg_productivity).toFixed(0)}
                          </div>
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            points {(100 - dashboardData.weekStats.avgRisk) > dashboardData.peerBenchmark.avg_productivity ? 'above' : 'below'} peers
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                          Productivity inversely correlates with burnout risk
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mental Wellness Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-blue-100 dark:border-blue-800/30">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Mental Wellness</h3>
                      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Your Estimated Score</span>
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            {Math.max(0, Math.min(100, 100 - dashboardData.weekStats.avgRisk + (dashboardData.weekStats.avgSleep >= 7 ? 10 : 0))).toFixed(0)}
                          </span>
                        </div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                            style={{ width: `${Math.max(0, Math.min(100, 100 - dashboardData.weekStats.avgRisk + (dashboardData.weekStats.avgSleep >= 7 ? 10 : 0)))}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Peer Average</span>
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            {dashboardData.peerBenchmark.avg_mental_wellness.toFixed(0)}
                          </span>
                        </div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${dashboardData.peerBenchmark.avg_mental_wellness}%` }}
                          />
                        </div>
                      </div>
                      <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
                        <div className="text-center bg-white/60 dark:bg-gray-900/60 rounded-lg py-3 px-4 mb-2">
                          <div className={`text-4xl font-bold mb-1 ${
                            (100 - dashboardData.weekStats.avgRisk + (dashboardData.weekStats.avgSleep >= 7 ? 10 : 0)) > dashboardData.peerBenchmark.avg_mental_wellness
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-orange-600 dark:text-orange-400'
                          }`}>
                            {Math.abs((100 - dashboardData.weekStats.avgRisk + (dashboardData.weekStats.avgSleep >= 7 ? 10 : 0)) - dashboardData.peerBenchmark.avg_mental_wellness).toFixed(0)}
                          </div>
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            points {(100 - dashboardData.weekStats.avgRisk + (dashboardData.weekStats.avgSleep >= 7 ? 10 : 0)) > dashboardData.peerBenchmark.avg_mental_wellness ? 'above' : 'below'} peers
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                          Mental wellness factors: stress levels, sleep quality, social connection
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Wellness Insights */}
            <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-900/10 dark:via-indigo-900/10 dark:to-blue-900/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-purple-100 dark:border-purple-800/30">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your Wellness Insights</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Personalized recommendations based on your data and peer benchmarks</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Burnout Risk */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      dashboardData?.weekStats.avgRisk > 70 ? 'bg-red-100 dark:bg-red-900/30'
                      : dashboardData?.weekStats.avgRisk > 50 ? 'bg-orange-100 dark:bg-orange-900/30'
                      : dashboardData?.weekStats.avgRisk > 30 ? 'bg-yellow-100 dark:bg-yellow-900/30'
                      : 'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      <span className="text-2xl">
                        {dashboardData?.weekStats.avgRisk > 70 ? '🔥'
                        : dashboardData?.weekStats.avgRisk > 50 ? '⚠️'
                        : dashboardData?.weekStats.avgRisk > 30 ? '⚡'
                        : '✅'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Burnout Risk</h3>
                      <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        dashboardData?.weekStats.avgRisk > 70 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : dashboardData?.weekStats.avgRisk > 50 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                        : dashboardData?.weekStats.avgRisk > 30 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                        {dashboardData?.weekStats.avgRisk > 70 ? 'Critical'
                        : dashboardData?.weekStats.avgRisk > 50 ? 'High'
                        : dashboardData?.weekStats.avgRisk > 30 ? 'Moderate'
                        : 'Healthy'}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {dashboardData?.weekStats.avgRisk > 70
                      ? "Critical burnout risk detected. Immediate rest and support needed."
                      : dashboardData?.weekStats.avgRisk > 50
                      ? "Elevated burnout risk. Long hours with diminishing returns."
                      : dashboardData?.weekStats.avgRisk > 30
                      ? "Moderate stress levels. Time to set better boundaries."
                      : "Great job maintaining healthy work-life balance!"}
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">Key Actions:</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {dashboardData?.weekStats.avgRisk > 70 ? (
                        <>
                          <li>• Take 2-3 days off if possible</li>
                          <li>• Seek professional support</li>
                          <li>• Reduce hours by 25-30%</li>
                        </>
                      ) : dashboardData?.weekStats.avgRisk > 50 ? (
                        <>
                          <li>• Limit to 8 hours/day maximum</li>
                          <li>• Take breaks every 2 hours</li>
                          <li>• Focus on high-impact tasks only</li>
                        </>
                      ) : dashboardData?.weekStats.avgRisk > 30 ? (
                        <>
                          <li>• Set work cutoff time (6-7 PM)</li>
                          <li>• Schedule recovery activities</li>
                          <li>• Practice time-boxing tasks</li>
                        </>
                      ) : (
                        <>
                          <li>• Maintain current habits</li>
                          <li>• Share strategies with peers</li>
                          <li>• Monitor for early warnings</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Sleep Quality */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      dashboardData?.weekStats.avgSleep < 6 ? 'bg-red-100 dark:bg-red-900/30'
                      : dashboardData?.weekStats.avgSleep < 7 ? 'bg-orange-100 dark:bg-orange-900/30'
                      : 'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      <span className="text-2xl">😴</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sleep & Recovery</h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {dashboardData?.weekStats.avgSleep}h average
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {dashboardData?.weekStats.avgSleep < 6
                      ? "Severe sleep debt reducing performance by 40-60%."
                      : dashboardData?.weekStats.avgSleep < 7
                      ? "Below optimal. Add 30-60min for 20-30% performance boost."
                      : "Optimal sleep range! Key protective factor against burnout."}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                      <div className="text-[10px] text-gray-600 dark:text-gray-400">Focus Capacity</div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {dashboardData?.weekStats.avgSleep < 6 ? '45%' : dashboardData?.weekStats.avgSleep < 7 ? '75%' : '95%'}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                      <div className="text-[10px] text-gray-600 dark:text-gray-400">Error Rate</div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {dashboardData?.weekStats.avgSleep < 6 ? '+300%' : dashboardData?.weekStats.avgSleep < 7 ? '+150%' : 'Normal'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">Sleep Tips:</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Consistent bedtime (even weekends)</li>
                      <li>• No screens 60min before bed</li>
                      <li>• Cool room (65-68°F)</li>
                      <li>• No caffeine after 2 PM</li>
                    </ul>
                  </div>
                </div>

                {/* Productivity Insights */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">⏰</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Work Efficiency</h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Quality output: {Math.max(20, 100 - dashboardData?.weekStats.avgRisk)}%
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {dashboardData?.weekStats.avgRisk > 60
                      ? "Long hours not translating to output. Fatigue reducing effectiveness."
                      : dashboardData?.weekStats.avgRisk > 40
                      ? "Moderate overwork. Diminishing returns kicking in."
                      : "Productive work patterns maintained!"}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Effective Hours</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {dashboardData?.weekStats.avgRisk > 70 ? '2-3h' : dashboardData?.weekStats.avgRisk > 50 ? '4-5h' : dashboardData?.weekStats.avgRisk > 30 ? '6-7h' : '7-8h'}/day
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.max(20, 100 - dashboardData?.weekStats.avgRisk)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-3">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Work Smarter:</p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• 90-min focus blocks with breaks</li>
                        <li>• Stop when tired (tired work = wasted time)</li>
                        <li>• Measure output, not hours</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Peer Insights */}
                {dashboardData?.peerBenchmark && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">👥</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Peer Comparison</h3>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          vs {dashboardData.peerBenchmark.count} similar professionals
                        </div>
                      </div>
                    </div>
                    <div className="mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800/30">
                      {dashboardData.weekStats.avgRisk < (dashboardData.peerBenchmark.avg_stress / 10) * 100 ? (
                        <div className="text-center">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">✅ You're performing</div>
                          <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
                            {Math.abs(dashboardData.weekStats.avgRisk - (dashboardData.peerBenchmark.avg_stress / 10) * 100).toFixed(0)}%
                          </div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">better than your peer group</div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">📊 You're</div>
                          <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                            {Math.abs(dashboardData.weekStats.avgRisk - (dashboardData.peerBenchmark.avg_stress / 10) * 100).toFixed(0)} points
                          </div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">above peer average risk</div>
                        </div>
                      )}
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-3">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">What Top Performers Do:</p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• 85% stop work by 6-7 PM</li>
                        <li>• 78% do weekly planning sessions</li>
                        <li>• 81% exercise 3+ times weekly</li>
                        <li>• Top performers decline 40% of requests</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Action Plan */}
              <div className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-4">🎯 Today's Action Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-semibold mb-2 opacity-90">Do Now:</p>
                    <ul className="text-sm space-y-1.5 opacity-90">
                      {dashboardData?.weekStats.avgSleep < 7 && <li>✓ Set bedtime alarm for 9:30 PM</li>}
                      {dashboardData?.weekStats.avgRisk > 50 && <li>✓ Schedule 3 breaks in calendar</li>}
                      <li>✓ Take 10-min walk after lunch</li>
                      <li>✓ Pick #1 priority for tomorrow</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2 opacity-90">This Week:</p>
                    <ul className="text-sm space-y-1.5 opacity-90">
                      {dashboardData?.weekStats.avgRisk > 60 && <li>✓ Reduce hours by 2-3h daily</li>}
                      {dashboardData?.weekStats.avgSleep < 7 && <li>✓ Get 7+ hours sleep 5 nights</li>}
                      <li>✓ Practice saying "no" once</li>
                      <li>✓ Review workload priorities</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Results Modal */}
      {showResults && riskResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-4">
          <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Wellness Analysis Results</h2>
                  <p className="text-xs text-indigo-100 mt-0.5">
                    Your check-in has been analyzed
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowResults(false);
                    setRiskResult(null);
                    setPeerBenchmark(null);
                    setShowCheckin(false);
                    setCurrentStep(1);
                    // Reset form
                    setForm({
                      sleepHours: "7",
                      sleepQuality: "3",
                      exerciseMinutes: "0",
                      socialHours: "0",
                      leisureScreenHours: "0",
                      workScreenHours: "8",
                      stressLevel: "5",
                      mentalWellness: "50",
                    });
                  }}
                  className="text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Results Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Risk Score Card */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-red-100 dark:border-red-800/50">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 mb-4">
                      <span className="text-3xl font-bold text-white">
                        {riskResult.riskScore !== null ? Math.round(riskResult.riskScore) : "N/A"}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Burnout Risk Score
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {riskResult.riskScore !== null 
                        ? `${Math.round(riskResult.riskScore)}% risk of burnout`
                        : "Risk score not available"}
                    </p>
                    {riskResult.riskScore !== null && (
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              riskResult.riskScore < 30 ? "bg-green-500" :
                              riskResult.riskScore < 60 ? "bg-yellow-500" :
                              "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(100, riskResult.riskScore)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>Low</span>
                          <span>Moderate</span>
                          <span>High</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actionable Insight */}
                {riskResult.actionableInsight && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800/50">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          #1 Actionable Insight
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300">
                          {riskResult.actionableInsight}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Peer Group Benchmark */}
                {peerBenchmark && userProfile && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-100 dark:border-purple-800/50">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        How You Compare
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        vs. {userProfile.work_mode} {userProfile.occupation}s ({peerBenchmark.count} peers)
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Productivity Comparison */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Productivity</span>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                              You: {form.mentalWellness || 50}
                            </span>
                            <span className="text-gray-500">vs</span>
                            <span className="text-gray-600 dark:text-gray-400">
                              Avg: {Math.round(peerBenchmark.avg_productivity || 50)}
                            </span>
                          </div>
                        </div>
                        <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className="absolute h-3 bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, parseInt(form.mentalWellness) || 50)}%` }}
                          ></div>
                          <div
                            className="absolute h-3 border-2 border-gray-600 dark:border-gray-300 rounded-full"
                            style={{ 
                              left: `${Math.min(100, peerBenchmark.avg_productivity || 50)}%`,
                              width: '3px',
                              transform: 'translateX(-50%)'
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Stress Comparison */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Stress Level</span>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-orange-600 dark:text-orange-400 font-semibold">
                              You: {form.stressLevel}/10
                            </span>
                            <span className="text-gray-500">vs</span>
                            <span className="text-gray-600 dark:text-gray-400">
                              Avg: {(peerBenchmark.avg_stress || 5).toFixed(1)}/10
                            </span>
                          </div>
                        </div>
                        <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className="absolute h-3 bg-orange-500 rounded-full transition-all"
                            style={{ width: `${(parseInt(form.stressLevel) / 10) * 100}%` }}
                          ></div>
                          <div
                            className="absolute h-3 border-2 border-gray-600 dark:border-gray-300 rounded-full"
                            style={{ 
                              left: `${((peerBenchmark.avg_stress || 5) / 10) * 100}%`,
                              width: '3px',
                              transform: 'translateX(-50%)'
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Wellness Comparison */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mental Wellness</span>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-green-600 dark:text-green-400 font-semibold">
                              You: {form.mentalWellness}
                            </span>
                            <span className="text-gray-500">vs</span>
                            <span className="text-gray-600 dark:text-gray-400">
                              Avg: {Math.round(peerBenchmark.avg_mental_wellness || 50)}
                            </span>
                          </div>
                        </div>
                        <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className="absolute h-3 bg-green-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, parseInt(form.mentalWellness) || 50)}%` }}
                          ></div>
                          <div
                            className="absolute h-3 border-2 border-gray-600 dark:border-gray-300 rounded-full"
                            style={{ 
                              left: `${Math.min(100, peerBenchmark.avg_mental_wellness || 50)}%`,
                              width: '3px',
                              transform: 'translateX(-50%)'
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                        Your line shows where you stand • Peer average marked with a line
                      </p>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Check-in saved successfully!
                    </p>
                    <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                      Your wellness data has been recorded and analyzed.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Close Button */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={() => {
                  setShowResults(false);
                  setRiskResult(null);
                  setPeerBenchmark(null);
                  setShowCheckin(false);
                  setCurrentStep(1);
                  // Reset form
                  setForm({
                    sleepHours: "7",
                    sleepQuality: "3",
                    exerciseMinutes: "0",
                    socialHours: "0",
                    leisureScreenHours: "0",
                    workScreenHours: "8",
                    stressLevel: "5",
                    mentalWellness: "50",
                  });
                }}
                className="w-full px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Check-in Modal */}
      {showCheckin && !showResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-4">
          <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Daily Check-in</h2>
                  <p className="text-xs text-indigo-100 mt-0.5">
                    How are you feeling today?
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCheckin(false);
                    setError(null);
                    setSuccess(false);
                    setCurrentStep(1);
                    setUserDismissedCheckin(true);
                  }}
                  className="text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-indigo-100">Step {currentStep} of {totalSteps}</span>
                  <span className="text-xs font-medium text-indigo-100">{Math.round((currentStep / totalSteps) * 100)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div
                    className="bg-white h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Form Content - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0">

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm">Loading your profile...</p>
              </div>
            ) : (
              <form 
                id="checkin-form" 
                onSubmit={(e) => {
                  // Only allow submission on the last step
                  if (currentStep < totalSteps) {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentStep((prev) => prev + 1);
                    return;
                  }
                  handleSubmit(e);
                }}
                onKeyDown={(e) => {
                  // Prevent form submission on Enter key unless on last step
                  if (e.key === 'Enter' && currentStep < totalSteps) {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentStep((prev) => prev + 1);
                  }
                }}
              >
                {/* Step 1: Sleep Quality */}
                {currentStep === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Sleep Quality</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tell us about your sleep patterns</p>
                    </div>

                    {/* Sleep Hours */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Average Sleep (per night)
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[4, 5, 6, 7, 8, 9, 10].map((hours) => (
                          <button
                            key={hours}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, sleepHours: hours.toString() }))}
                            className={`py-2.5 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                              form.sleepHours === hours.toString()
                                ? "bg-indigo-600 text-white shadow-md scale-105"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            {hours}h
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sleep Quality */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Sleep Quality (last night)
                      </label>
                      <div className="flex gap-2">
                        {[
                          { value: "1", label: "Poor", emoji: "😴" },
                          { value: "2", label: "Fair", emoji: "😌" },
                          { value: "3", label: "Good", emoji: "😊" },
                          { value: "4", label: "Very Good", emoji: "😄" },
                          { value: "5", label: "Excellent", emoji: "🌟" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, sleepQuality: option.value }))}
                            className={`flex-1 py-3 rounded-lg text-2xl font-bold transition-all transform hover:scale-105 ${
                              parseInt(form.sleepQuality) >= parseInt(option.value)
                                ? "bg-yellow-400 text-yellow-900 shadow-md scale-105"
                                : "bg-white dark:bg-gray-800 text-gray-300 border-2 border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            {option.emoji}
                            <div className="text-[10px] mt-0.5 font-normal">{option.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Activity */}
                {currentStep === 2 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Activity & Social</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">How active were you yesterday?</p>
                    </div>

                    {/* Exercise */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800/50">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Exercise (yesterday) - minutes
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const val = Math.max(0, parseInt(form.exerciseMinutes) - 30);
                            setForm((prev) => ({ ...prev, exerciseMinutes: val.toString() }));
                          }}
                          className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border-2 border-green-200 dark:border-green-700 text-green-600 font-bold hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={form.exerciseMinutes}
                          onChange={handleChange("exerciseMinutes")}
                          className="flex-1 text-center text-2xl font-bold rounded-lg border-2 border-green-200 dark:border-green-700 bg-white dark:bg-gray-800 px-3 py-4 text-gray-900 dark:text-white focus:border-green-500 focus:ring-green-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseInt(form.exerciseMinutes) + 30;
                            setForm((prev) => ({ ...prev, exerciseMinutes: val.toString() }));
                          }}
                          className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border-2 border-green-200 dark:border-green-700 text-green-600 font-bold hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-center text-xs text-gray-500 mt-2">
                        <span className="font-bold text-green-600">{form.exerciseMinutes} minutes</span> yesterday
                      </p>
                    </div>

                    {/* Social Hours */}
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-4 border border-pink-100 dark:border-pink-800/50">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Social Time (yesterday) - hours
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const val = Math.max(0, parseFloat(form.socialHours) - 1);
                            setForm((prev) => ({ ...prev, socialHours: val.toString() }));
                          }}
                          className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border-2 border-pink-200 dark:border-pink-700 text-pink-600 font-bold hover:bg-pink-50 dark:hover:bg-pink-900/20"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={form.socialHours}
                          onChange={handleChange("socialHours")}
                          className="flex-1 text-center text-2xl font-bold rounded-lg border-2 border-pink-200 dark:border-pink-700 bg-white dark:bg-gray-800 px-3 py-4 text-gray-900 dark:text-white focus:border-pink-500 focus:ring-pink-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseFloat(form.socialHours) + 1;
                            setForm((prev) => ({ ...prev, socialHours: val.toString() }));
                          }}
                          className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border-2 border-pink-200 dark:border-pink-700 text-pink-600 font-bold hover:bg-pink-50 dark:hover:bg-pink-900/20"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-center text-xs text-gray-500 mt-2">
                        <span className="font-bold text-pink-600">{form.socialHours} hours</span> yesterday
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3: Screen Time */}
                {currentStep === 3 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Screen Time</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">How much time do you spend on screens?</p>
                    </div>

                    {/* Work Screen Time */}
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800/50">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Work Screen Time (avg. per day) - hours
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[0, 2, 4, 6, 8, 10, 12, 14].map((hours) => (
                          <button
                            key={hours}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, workScreenHours: hours.toString() }))}
                            className={`py-2.5 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                              form.workScreenHours === hours.toString()
                                ? "bg-purple-600 text-white shadow-md scale-105"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            {hours}h
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Leisure Screen Time */}
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800/50">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Leisure Screen Time (avg. per day) - hours
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[0, 1, 2, 3, 4, 5, 6, 8].map((hours) => (
                          <button
                            key={hours}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, leisureScreenHours: hours.toString() }))}
                            className={`py-2.5 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                              form.leisureScreenHours === hours.toString()
                                ? "bg-purple-600 text-white shadow-md scale-105"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            {hours}h
                          </button>
                        ))}
                      </div>
                    </div>

                    {parseFloat(form.workScreenHours) + parseFloat(form.leisureScreenHours) > 0 && (
                      <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3 text-center">
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          <span className="font-semibold">Total:</span>{" "}
                          {(parseFloat(form.workScreenHours) + parseFloat(form.leisureScreenHours)).toFixed(1)} hours/day
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Wellness Indicators */}
                {currentStep === 4 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Wellness Indicators</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">How are you feeling overall?</p>
                    </div>

                    {/* Stress Level */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-4 border border-orange-100 dark:border-orange-800/50">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Stress Level
                      </label>
                      <div className="grid grid-cols-6 gap-1.5">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, stressLevel: level.toString() }))}
                            className={`py-2.5 rounded-lg font-bold text-sm transition-all transform hover:scale-105 ${
                              parseInt(form.stressLevel) >= level
                                ? level <= 3
                                  ? "bg-green-500 text-white shadow-md"
                                  : level <= 6
                                  ? "bg-yellow-500 text-white shadow-md"
                                  : "bg-red-500 text-white shadow-md"
                                : "bg-white dark:bg-gray-800 text-gray-400 border-2 border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                      <p className="text-center text-xs text-gray-500 mt-2">
                        {parseInt(form.stressLevel) <= 3 && "😌 Low stress - Great!"}
                        {parseInt(form.stressLevel) > 3 && parseInt(form.stressLevel) <= 6 && "😐 Moderate stress"}
                        {parseInt(form.stressLevel) > 6 && "😰 High stress - Take care"}
                      </p>
                    </div>

                    {/* Mental Wellness */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-4 border border-orange-100 dark:border-orange-800/50">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Mental Wellness Index
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[0, 20, 40, 60, 80, 100].map((wellness) => (
                          <button
                            key={wellness}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, mentalWellness: wellness.toString() }))}
                            className={`py-2.5 rounded-lg font-bold text-sm transition-all transform hover:scale-105 ${
                              parseInt(form.mentalWellness) >= wellness && parseInt(form.mentalWellness) < wellness + 20
                                ? "bg-indigo-600 text-white shadow-md scale-105"
                                : parseInt(form.mentalWellness) >= wellness
                                ? "bg-indigo-400 text-white"
                                : "bg-white dark:bg-gray-800 text-gray-400 border-2 border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            {wellness}
                          </button>
                        ))}
                      </div>
                      <p className="text-center text-xs text-gray-500 mt-2">
                        Current: <span className="font-bold text-indigo-600">{form.mentalWellness}/100</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Messages */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-3 flex items-start gap-2 mb-4">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg p-3 flex items-start gap-2 mb-4">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Check-in submitted successfully! Analyzing your wellness...
                    </p>
                  </div>
                )}
              </form>
            )}
            </div>

            {/* Navigation Buttons - Fixed at bottom */}
            {!loading && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 flex-shrink-0 bg-white dark:bg-gray-900">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentStep((prev) => prev - 1);
                    }}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-all flex items-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                ) : (
                  <div></div>
                )}

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Explicitly prevent any form submission
                      if (currentStep < totalSteps) {
                        setCurrentStep((prev) => prev + 1);
                      }
                    }}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all hover:shadow-lg flex items-center gap-2 ml-auto text-sm"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="checkin-form"
                    disabled={submitting}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all hover:shadow-lg flex items-center justify-center gap-2 ml-auto text-sm"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <span>Analyze</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

