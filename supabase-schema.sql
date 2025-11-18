-- SQL Schema for WellSync - Unproductive Overwork Tracker
-- Run this in Supabase SQL Editor to populate persona_benchmarks table

-- ============================================================================
-- NOTE: The persona_benchmarks table already exists with this structure:
-- ============================================================================
-- CREATE TABLE public.persona_benchmarks (
--   id BIGSERIAL PRIMARY KEY,
--   occupation TEXT NOT NULL,
--   work_mode TEXT NOT NULL,
--   avg_stress DOUBLE PRECISION NULL,
--   avg_productivity DOUBLE PRECISION NULL,
--   avg_mental_wellness DOUBLE PRECISION NULL,
--   count INTEGER NULL
-- );
-- CREATE UNIQUE INDEX persona_benchmarks_unique_group 
--   ON public.persona_benchmarks (occupation, work_mode);
-- ============================================================================

-- ============================================================================
-- Enable Row Level Security (if not already enabled)
-- ============================================================================

ALTER TABLE public.persona_benchmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read benchmarks" ON public.persona_benchmarks;
DROP POLICY IF EXISTS "Only service role can modify benchmarks" ON public.persona_benchmarks;

-- Allow all authenticated users to read benchmark data
CREATE POLICY "Allow authenticated users to read benchmarks"
  ON public.persona_benchmarks
  FOR SELECT
  TO authenticated
  USING (true);

-- Only allow service role to insert/update benchmark data
CREATE POLICY "Only service role can modify benchmarks"
  ON public.persona_benchmarks
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- Sample Benchmark Data
-- ============================================================================
-- Replace these values with your actual calculated benchmarks from real user data
-- These are realistic sample values based on common wellness patterns

INSERT INTO public.persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count)
VALUES 
  -- Students
  ('Student', 'Remote', 8.1, 45.5, 35.0, 45),
  ('Student', 'Hybrid', 7.5, 50.2, 40.5, 32),
  ('Student', 'In-person', 6.8, 55.0, 45.0, 28),
  
  -- Employed
  ('Employed', 'Remote', 7.2, 60.5, 50.0, 120),
  ('Employed', 'Hybrid', 6.5, 65.0, 55.5, 95),
  ('Employed', 'In-person', 5.8, 70.0, 60.0, 80),
  
  -- Self-employed
  ('Self-employed', 'Remote', 8.5, 55.0, 42.0, 38),
  ('Self-employed', 'Hybrid', 7.8, 58.5, 46.5, 22),
  ('Self-employed', 'In-person', 7.0, 62.0, 50.0, 15)
ON CONFLICT (occupation, work_mode) 
DO UPDATE SET
  avg_stress = EXCLUDED.avg_stress,
  avg_productivity = EXCLUDED.avg_productivity,
  avg_mental_wellness = EXCLUDED.avg_mental_wellness,
  count = EXCLUDED.count;

-- ============================================================================
-- Verify the data
-- ============================================================================

SELECT 
  occupation,
  work_mode,
  avg_stress,
  avg_productivity,
  avg_mental_wellness,
  count
FROM public.persona_benchmarks
ORDER BY occupation, work_mode;

-- ============================================================================
-- Helper function to recalculate benchmarks from real check_ins data
-- ============================================================================
-- This function can be used once you have enough real user data

CREATE OR REPLACE FUNCTION public.recalculate_persona_benchmarks()
RETURNS TABLE(
  occupation TEXT,
  work_mode TEXT,
  avg_stress DOUBLE PRECISION,
  avg_productivity DOUBLE PRECISION,
  avg_mental_wellness DOUBLE PRECISION,
  user_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_averages AS (
    SELECT 
      u.occupation,
      u.work_mode,
      u.id as user_id,
      AVG(COALESCE(c.calculated_risk_score, 0) / 10.0) as user_avg_stress,
      AVG(50.0) as user_avg_productivity,  -- Placeholder - adjust based on your data
      AVG(50.0) as user_avg_mental_wellness  -- Placeholder - adjust based on your data
    FROM public.users u
    INNER JOIN public.check_ins c ON u.id = c.user_id
    WHERE u.occupation IS NOT NULL 
      AND u.work_mode IS NOT NULL
    GROUP BY u.occupation, u.work_mode, u.id
  )
  SELECT 
    ua.occupation,
    ua.work_mode,
    ROUND(AVG(ua.user_avg_stress)::numeric, 2)::DOUBLE PRECISION as avg_stress,
    ROUND(AVG(ua.user_avg_productivity)::numeric, 2)::DOUBLE PRECISION as avg_productivity,
    ROUND(AVG(ua.user_avg_mental_wellness)::numeric, 2)::DOUBLE PRECISION as avg_mental_wellness,
    COUNT(DISTINCT ua.user_id) as user_count
  FROM user_averages ua
  GROUP BY ua.occupation, ua.work_mode
  HAVING COUNT(DISTINCT ua.user_id) >= 5;  -- Only include groups with at least 5 users
END;
$$;

-- Example usage to update benchmarks from real data:
-- INSERT INTO public.persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count)
-- SELECT occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, user_count::INTEGER
-- FROM public.recalculate_persona_benchmarks()
-- ON CONFLICT (occupation, work_mode)
-- DO UPDATE SET
--   avg_stress = EXCLUDED.avg_stress,
--   avg_productivity = EXCLUDED.avg_productivity,
--   avg_mental_wellness = EXCLUDED.avg_mental_wellness,
--   count = EXCLUDED.count;

-- ============================================================================
-- Notes
-- ============================================================================
-- 1. The sample data provided is for testing purposes
-- 2. Stress is on a 0-10 scale (lower is better)
-- 3. Productivity is on a 0-100 scale (higher is better)
-- 4. Mental wellness is on a 0-100 scale (higher is better)
-- 5. Count represents the number of users in each peer group
-- 6. You can periodically run recalculate_persona_benchmarks() to update
--    benchmarks based on real user data once you have enough users
