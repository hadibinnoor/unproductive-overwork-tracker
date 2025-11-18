'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { supabaseBrowserClient } from "@/lib/supabaseClient";

type CheckIn = {
  id: number;
  created_at: string;
  sleep_hours: number;
  sleep_quality_1_5: number;
  exercise_minutes_per_week: number;
  social_hours_per_week: number;
  leisure_screen_hours: number;
  calculated_risk_score: number | null;
};

export default function HistoryPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    const loadCheckIns = async () => {
      const {
        data: { user },
      } = await supabaseBrowserClient.auth.getUser();

      if (!user) {
        router.push("/signup");
        return;
      }

      // Get check-ins from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error: fetchError } = await supabaseBrowserClient
        .from("check_ins")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setCheckIns(data || []);
      setLoading(false);
    };

    loadCheckIns();
  }, [router]);

  const handleSignOut = async () => {
    await supabaseBrowserClient.auth.signOut();
    router.push("/");
  };

  // Prepare chart data (reverse order for chronological display)
  const chartData = [...checkIns].reverse();
  const maxRisk = Math.max(...checkIns.map(c => c.calculated_risk_score || 0), 100);

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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Your Wellness Journey</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Track your progress over the last 30 days
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading your history...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : checkIns.length === 0 ? (
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/40 dark:border-gray-800 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No check-ins yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Start your wellness journey by completing your first daily check-in.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Risk Score Chart */}
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/40 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Burnout Risk Trend</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your risk score over time</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Risk Score</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Line Chart */}
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
                  {chartData.length > 1 && (
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
                        points={`0,100 ${chartData
                          .map((item, index) => {
                            const x = (index / (chartData.length - 1)) * 100;
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
                        points={chartData
                          .map((item, index) => {
                            const x = (index / (chartData.length - 1)) * 100;
                            const y = 100 - (item.calculated_risk_score || 0);
                            return `${x},${y}`;
                          })
                          .join(" ")}
                      />
                    </svg>
                  )}

                  {/* Data points overlay */}
                  {chartData.length > 1 && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {chartData.map((item, index) => {
                        const x = (index / (chartData.length - 1)) * 100;
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
                  )}
                </div>
              </div>

              {/* X-axis labels (dates) */}
              <div className="flex justify-between mt-4 text-xs text-gray-500 dark:text-gray-400">
                {chartData.length > 0 && (
                  <>
                    <span>{new Date(chartData[0].created_at).toLocaleDateString()}</span>
                    {chartData.length > 1 && (
                      <span>{new Date(chartData[chartData.length - 1].created_at).toLocaleDateString()}</span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/40 dark:border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Check-ins</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{checkIns.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/40 dark:border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Risk Score</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {Math.round(checkIns.reduce((sum, c) => sum + (c.calculated_risk_score || 0), 0) / checkIns.length)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/40 dark:border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Sleep</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {(checkIns.reduce((sum, c) => sum + (c.sleep_hours || 0), 0) / checkIns.length).toFixed(1)}h
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Check-ins Table */}
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/40 dark:border-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">All Check-ins</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Risk Score</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Sleep</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Sleep Quality</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Exercise</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Social</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Screen Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkIns.map((checkIn) => (
                      <tr key={checkIn.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {new Date(checkIn.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            (checkIn.calculated_risk_score || 0) < 30
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : (checkIn.calculated_risk_score || 0) < 60
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {checkIn.calculated_risk_score || 0}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                          {checkIn.sleep_hours?.toFixed(1) || 0}h
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= (checkIn.sleep_quality_1_5 || 0)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                          {checkIn.exercise_minutes_per_week || 0} min
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                          {checkIn.social_hours_per_week?.toFixed(1) || 0}h
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                          {checkIn.leisure_screen_hours?.toFixed(1) || 0}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
