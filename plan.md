# WellSync Implementation Plan

## 1. Product Overview
- **Goal**: Help users detect and prevent unproductive overwork by blending wellness check-ins, AI-driven risk scoring, and peer benchmarking.
- **Primary Persona**: Knowledge workers/students who connect regularly (weekly) to maintain healthy work–life balance.
- **Platforms & Stack**: Next.js frontend, Supabase Auth & Postgres, logistic regression risk API (Edge Function/Heroku).

## 2. User Journey & Screens
1. **Sign Up / Sign In (Screen 1)**
   - Supabase Auth handles email/password flows.
   - Tabs for Sign In/Sign Up plus Forgot Password link.
2. **First-Time Profile Setup (Screen 2)**
   - Triggered when `users.occupation` is empty.
   - Form fields: Occupation, Work Mode, Age, Gender.
   - Action saves to `users` table; unlocks dashboard.
3. **Dashboard – Check-in View (Screen 3A)**
   - Default state after profile completion.
   - Inputs: Sleep Hours, Sleep Quality (1–5), Exercise Minutes, Social Hours, Leisure Screen Hours.
   - CTA: **Analyze My Wellness →**.
4. **Dashboard – Results View (Screen 3B)**
   - Displays after analyze flow resolves.
   - Sections: Burnout Risk %, #1 Actionable Insight, Peer Benchmark card comparing productivity/stress/wellness.
5. **History Page (Screen 4)**
   - Line chart of `mental_wellness_index_0_100` (or productivity) for last 30 days.
   - Table of past check-ins.
6. **Profile Page (Screen 5)**
   - Same form as Screen 2 for editing persona fields.
   - Needed for persona changes (e.g., Student → Employed).

## 3. Data Architecture (Supabase)
| Table | Purpose | Key Columns |
| --- | --- | --- |
| `users` | Stores digital persona data (1-1 with `auth.users`). | `id (uuid PK/FK auth.users.id)`, `email`, `occupation`, `work_mode`, `age`, `gender`, `created_at`. |
| `check_ins` | Historical check-ins per user. | `id (bigint PK)`, `user_id (uuid FK)`, `created_at`, `sleep_hours`, `sleep_quality_1_5`, `exercise_minutes_per_week`, `social_hours_per_week`, `leisure_screen_hours`, `calculated_risk_score`. |
| `persona_benchmarks` | Precomputed peer averages (read-only). | `id`, `occupation`, `work_mode`, `avg_stress`, `avg_productivity`, `avg_mental_wellness`, `count`. |

**Security**: All tables enforce row-level security so users only access their data (benchmarks are readable by all authenticated users).

## 4. Analyze-Button Data Flow
1. **Collect Form Data** (sleep, exercise, etc.) in the Check-in view.
2. **Auth Lookup**: Fetch current user via `supabase.auth.getUser()` to obtain `user_id`.
3. **Persist Check-in**: Write form payload to `check_ins` with the `user_id`.
4. **Risk API Call**: Send form + persona data to logistic regression service; receive `risk_score` + `actionable_insight`.
5. **Peer Benchmark Query**: Use `occupation` + `work_mode` to fetch matching row from `persona_benchmarks`.
6. **Render Results**: Replace form with Results view, showing risk percentage, prioritized action, and peer comparison metrics.

## 5. Implementation Milestones
### Frontend
- Build multi-state dashboard with clear transitions between check-in and results.
- Create shared components for metric cards, charts, and persona form.
- Implement History page chart & table once `check_ins` data is available.

### Backend/Data
- Configure Supabase tables and RLS policies matching spec.
- Seed `persona_benchmarks` from existing CSV via script.
- Ensure logistic regression API/Edge Function accepts required payload.

### Analytics & QA
- Track submission funnel (sign-up → profile → first check-in).
- Add unit/integration tests for Supabase data hooks and API integration.
- Verify responsiveness, accessibility, and dark-mode parity.

## 6. Next Steps
1. Scaffold Supabase schema migrations and seed benchmark data.
2. Implement authentication + guarded routes for onboarding versus dashboard.
3. Build Check-in form and tie into Supabase insert + risk API call.
4. Create Results, History, and Profile screens with shared design language.
5. Instrument analytics and add comprehensive QA/test coverage.

