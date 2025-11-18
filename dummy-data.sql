-- Dummy Check-in Data for User: f7424538-c9fa-4631-af76-df48f765bec7
-- This creates 2 weeks of daily check-ins with realistic varying data

-- First, verify the user exists in the users table
-- If not, insert the user record (adjust occupation and work_mode as needed)
INSERT INTO public.users (id, email, occupation, work_mode, age, gender, created_at)
VALUES (
  'f7424538-c9fa-4631-af76-df48f765bec7'::uuid,
  'testuser@example.com',
  'Student',
  'Remote',
  24,
  'Male',
  NOW() - INTERVAL '30 days'
)
ON CONFLICT (id) DO UPDATE SET
  occupation = EXCLUDED.occupation,
  work_mode = EXCLUDED.work_mode;

-- Insert 14 days of check-ins (2 weeks)
-- Day 1 (14 days ago) - High stress, poor sleep
INSERT INTO public.check_ins (user_id, created_at, sleep_hours, sleep_quality_1_5, exercise_minutes_per_week, social_hours_per_week, leisure_screen_hours, calculated_risk_score)
VALUES (
  'f7424538-c9fa-4631-af76-df48f765bec7'::uuid,
  NOW() - INTERVAL '14 days',
  5.5,
  2,
  15,
  1.0,
  4.5,
  78
);

-- Day 2 (13 days ago) - Still stressed
INSERT INTO public.check_ins (user_id, created_at, sleep_hours, sleep_quality_1_5, exercise_minutes_per_week, social_hours_per_week, leisure_screen_hours, calculated_risk_score)
VALUES (
  'f7424538-c9fa-4631-af76-df48f765bec7'::uuid,
  NOW() - INTERVAL '13 days',
  6.0,
  2,
  20,
  1.5,
  4.0,
  75
);

-- Day 3 (12 days ago) - Slight improvement
INSERT INTO public.check_ins (user_id, created_at, sleep_hours, sleep_quality_1_5, exercise_minutes_per_week, social_hours_per_week, leisure_screen_hours, calculated_risk_score)
VALUES (
  'f7424538-c9fa-4631-af76-df48f765bec7'::uuid,
  NOW() - INTERVAL '12 days',
  6.5,
  3,
  25,
  2.0,
  3.5,
  68
);

-- Day 4 (11 days ago) - Better sleep
INSERT INTO public.check_ins (user_id, created_at, sleep_hours, sleep_quality_1_5, exercise_minutes_per_week, social_hours_per_week, leisure_screen_hours, calculated_risk_score)
VALUES (
  'f7424538-c9fa-4631-af76-df48f765bec7'::uuid,
  NOW() - INTERVAL '11 days',
  7.0,
  3,
  30,
  2.5,
  3.0,
  62
);

-- Day 5 (10 days ago) - Weekend, more social
INSERT INTO public.check_ins (user_id, created_at, sleep_hours, sleep_quality_1_5, exercise_minutes_per_week, social_hours_per_week, leisure_screen_hours, calculated_risk_score)
VALUES (
  'f7424538-c9fa-4631-af76-df48f765bec7'::uuid,
  NOW() - INTERVAL '10 days',
  7.5,
  4,
  45,
  4.0,
  2.5,
  48
);

-- Day 6 (9 days ago) - Good day
INSERT INTO public.check_ins (user_id, created_at, sleep_hours, sleep_quality_1_5, exercise_minutes_per_week, social_hours_per_week, leisure_screen_hours, calculated_risk_score)
VALUES (
  'f7424538-c9fa-4631-af76-df48f765bec7'::uuid,
  NOW() - INTERVAL '9 days',
  8.0,
  4,
  40,
  3.5,
  2.0,
  42
);

-- Day 7 (8 days ago) - Stable
INSERT INTO public.check_ins (user_id, created_at, sleep_hours, sleep_quality_1_5, exercise_minutes_per_week, social_hours_per_week, leisure_screen_hours, calculated_risk_score)
VALUES (
  'f7424538-c9fa-4631-af76-df48f765bec7'::uuid,
  NOW() - INTERVAL '8 days',
  7.5,
  4,
  35,
  3.0,
  2.5,
  45
);

-- Day 8 (7 days ago) - Week 2 starts, bit tired
INSERT INTO public.check_ins (user_id, created_at, sleep_hours, sleep_quality_1_5, exercise_minutes_per_week, social_hours_per_week, leisure_screen_hours, calculated_risk_score)
VALUES (
  'f7424538-c9fa-4631-af76-df48f765bec7'::uuid,
  NOW() - INTERVAL '7 days',
  6.5,
  3,
  25,
  2.0,
  3.5,
  58
);

-- Day 9 (6 days ago) - Midweek stress
INSERT INTO public.check_ins (user_id, created_at, sleep_hours, sleep_quality_1_5, exercise_minutes_per_week, social_hours_per_week, leisure_screen_hours, calculated_risk_score)
VALUES (
  'f7424538-c9fa-4631-af76-df48f765bec7'::uuid,
  NOW() - INTERVAL '6 days',
  6.0,
  3,
  20,
  1.5,
  4.0,
  65
);

-- Day 10 (5 days ago) - Working hard
INSERT INTO public.check_ins (user_id, created_at, sleep_hours, sleep_quality_1_5, exercise_minutes_per_week, social_hours_per_week, leisure_screen_hours, calculated_risk_score)
VALUES (
  'f7424538-c9fa-4631-af76-df48f765bec7'::uuid,
  NOW() - INTERVAL '5 days',
  6.5,
  3,
  30,
  2.0,
  3.5,
  60
);

-- Day 11 (4 days ago) - Getting better
INSERT INTO public.check_ins (user_id, created_at, sleep_hours, sleep_quality_1_5, exercise_minutes_per_week, social_hours_per_week, leisure_screen_hours, calculated_risk_score)
VALUES (
  'f7424538-c9fa-4631-af76-df48f765bec7'::uuid,
  NOW() - INTERVAL '4 days',
  7.0,
  4,
  40,
  2.5,
  3.0,
  52
);

-- Day 12 (3 days ago) - Good progress
INSERT INTO public.check_ins (user_id, created_at, sleep_hours, sleep_quality_1_5, exercise_minutes_per_week, social_hours_per_week, leisure_screen_hours, calculated_risk_score)
VALUES (
  'f7424538-c9fa-4631-af76-df48f765bec7'::uuid,
  NOW() - INTERVAL '3 days',
  7.5,
  4,
  45,
  3.0,
  2.5,
  46
);

-- Day 13 (2 days ago) - Excellent day
INSERT INTO public.check_ins (user_id, created_at, sleep_hours, sleep_quality_1_5, exercise_minutes_per_week, social_hours_per_week, leisure_screen_hours, calculated_risk_score)
VALUES (
  'f7424538-c9fa-4631-af76-df48f765bec7'::uuid,
  NOW() - INTERVAL '2 days',
  8.0,
  5,
  50,
  3.5,
  2.0,
  38
);

-- Day 14 (yesterday) - Maintaining wellness
INSERT INTO public.check_ins (user_id, created_at, sleep_hours, sleep_quality_1_5, exercise_minutes_per_week, social_hours_per_week, leisure_screen_hours, calculated_risk_score)
VALUES (
  'f7424538-c9fa-4631-af76-df48f765bec7'::uuid,
  NOW() - INTERVAL '1 day',
  7.5,
  4,
  40,
  3.0,
  2.5,
  42
);

-- Verify the data was inserted
SELECT 
  DATE(created_at) as check_in_date,
  sleep_hours,
  sleep_quality_1_5,
  calculated_risk_score
FROM public.check_ins
WHERE user_id = 'f7424538-c9fa-4631-af76-df48f765bec7'::uuid
ORDER BY created_at DESC;

-- Show summary statistics
SELECT 
  COUNT(*) as total_check_ins,
  ROUND(AVG(sleep_hours)::numeric, 2) as avg_sleep,
  ROUND(AVG(calculated_risk_score)::numeric, 2) as avg_risk,
  MIN(calculated_risk_score) as best_risk,
  MAX(calculated_risk_score) as worst_risk
FROM public.check_ins
WHERE user_id = 'f7424538-c9fa-4631-af76-df48f765bec7'::uuid;
