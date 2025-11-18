# Supabase Tables Overview

## `users`
- **Purpose**: Stores each member’s digital persona and links to Supabase Auth.
- **Access**: Row-level security so users can only read/update their own row.
- **Columns**:
  - `id` (uuid, PK, FK → `auth.users.id`)
  - `created_at` (timestamptz, default `now()`)
  - `email` (text)
  - `occupation` (text, e.g., `Student`, `Employed`, `Self-employed`)
  - `work_mode` (text, e.g., `Remote`, `Hybrid`, `In-person`)
  - `age` (integer)
  - `gender` (text)

## `check_ins`
- **Purpose**: Historical record of every wellness check-in per user.
- **Access**: RLS restricts reads/writes to the owner (`user_id`).
- **Columns**:
  - `id` (bigint, PK, auto-increment)
  - `user_id` (uuid, FK → `users.id`)
  - `created_at` (timestamptz, default `now()`)
  - `sleep_hours` (float)
  - `sleep_quality_1_5` (integer)
  - `exercise_minutes_per_week` (integer)
  - `social_hours_per_week` (float)
  - `leisure_screen_hours` (float)
  - `calculated_risk_score` (integer, optional cache of model output)

## `persona_benchmarks`
- **Purpose**: Read-only peer-group averages generated from the source CSV.
- **Access**: Authenticated users can read all rows (no write access in app).
- **Columns**:
  - `id` (bigint, PK, auto-increment)
  - `occupation` (text)
  - `work_mode` (text)
  - `avg_stress` (float)
  - `avg_productivity` (float)
  - `avg_mental_wellness` (float)
  - `count` (integer, size of cohort sample)

## Notes
- Apply migration/seed scripts in Supabase to create tables, indexes, and RLS policies.
- Consider materialized views later for aggregated analytics (e.g., weekly trends).

