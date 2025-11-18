-- Seed data for persona_benchmarks table
-- This provides realistic benchmark data for different occupation + work_mode combinations
-- Based on typical burnout, productivity, and wellness patterns

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE persona_benchmarks;

-- Students - Undergraduate
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Undergraduate Student', 'Remote', 6.2, 72, 68, 45),
('Undergraduate Student', 'Hybrid', 5.8, 75, 72, 38),
('Undergraduate Student', 'In-person', 5.5, 78, 75, 52);

-- Students - High School
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('High School Student', 'Remote', 5.8, 74, 71, 34),
('High School Student', 'Hybrid', 5.5, 76, 73, 42),
('High School Student', 'In-person', 5.3, 79, 76, 58);

-- Students - Part-time Student (Working)
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Part-time Student', 'Remote', 7.0, 65, 61, 28),
('Part-time Student', 'Hybrid', 6.7, 68, 64, 31),
('Part-time Student', 'In-person', 6.9, 66, 62, 23);

-- Students - Online Degree
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Online Student', 'Remote', 6.4, 70, 66, 52),
('Online Student', 'Hybrid', 6.1, 72, 69, 18),
('Online Student', 'In-person', 5.9, 74, 71, 12);

-- Students - Medical/Nursing Student
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Medical Student', 'Remote', 7.8, 62, 54, 21),
('Medical Student', 'Hybrid', 7.5, 64, 57, 29),
('Medical Student', 'In-person', 7.6, 63, 55, 42);

-- Students - Law Student
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Law Student', 'Remote', 7.3, 64, 57, 18),
('Law Student', 'Hybrid', 7.0, 66, 60, 24),
('Law Student', 'In-person', 7.1, 65, 59, 31);

-- Students - Engineering Student
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Engineering Student', 'Remote', 6.8, 68, 63, 38),
('Engineering Student', 'Hybrid', 6.5, 70, 66, 47),
('Engineering Student', 'In-person', 6.4, 71, 68, 54);

-- Students - Arts/Humanities Student
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Arts Student', 'Remote', 5.9, 73, 69, 32),
('Arts Student', 'Hybrid', 5.6, 75, 72, 28),
('Arts Student', 'In-person', 5.7, 74, 70, 36);

-- Students - Business Student
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Business Student', 'Remote', 6.1, 72, 67, 41),
('Business Student', 'Hybrid', 5.8, 74, 70, 49),
('Business Student', 'In-person', 5.9, 73, 69, 52);

-- Students - Computer Science Student
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('CS Student', 'Remote', 6.3, 71, 66, 67),
('CS Student', 'Hybrid', 6.0, 73, 69, 58),
('CS Student', 'In-person', 6.1, 72, 68, 43);

-- Students - General (backwards compatibility)
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Student', 'Remote', 6.2, 72, 68, 45),
('Student', 'Hybrid', 5.8, 75, 72, 38),
('Student', 'In-person', 5.5, 78, 75, 52);

-- Employed (General)
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Employed', 'Remote', 5.9, 76, 71, 128),
('Employed', 'Hybrid', 5.6, 78, 74, 156),
('Employed', 'In-person', 6.1, 74, 69, 98);

-- Self-employed / Freelancers
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Self-employed', 'Remote', 6.8, 68, 64, 67),
('Self-employed', 'Hybrid', 6.3, 71, 68, 42),
('Self-employed', 'In-person', 6.5, 70, 66, 31);

-- Tech Workers / Software Engineers
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Software Engineer', 'Remote', 5.7, 79, 73, 89),
('Software Engineer', 'Hybrid', 5.4, 81, 76, 112),
('Software Engineer', 'In-person', 5.9, 77, 71, 45);

-- Healthcare Workers
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Healthcare Worker', 'Remote', 6.9, 71, 62, 23),
('Healthcare Worker', 'Hybrid', 7.2, 69, 59, 34),
('Healthcare Worker', 'In-person', 7.5, 67, 56, 78);

-- Teachers / Educators
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Teacher', 'Remote', 6.4, 70, 65, 54),
('Teacher', 'Hybrid', 6.1, 72, 68, 67),
('Teacher', 'In-person', 6.7, 68, 63, 89);

-- Designers (Graphic, UX, UI)
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Designer', 'Remote', 5.8, 77, 72, 56),
('Designer', 'Hybrid', 5.5, 79, 75, 48),
('Designer', 'In-person', 6.0, 75, 70, 34);

-- Marketing Professionals
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Marketing', 'Remote', 6.1, 74, 69, 62),
('Marketing', 'Hybrid', 5.8, 76, 72, 71),
('Marketing', 'In-person', 6.3, 72, 67, 43);

-- Sales Representatives
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Sales', 'Remote', 6.7, 70, 64, 58),
('Sales', 'Hybrid', 6.4, 72, 67, 49),
('Sales', 'In-person', 6.9, 68, 62, 67);

-- Data Scientists / Analysts
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Data Scientist', 'Remote', 5.6, 80, 74, 71),
('Data Scientist', 'Hybrid', 5.3, 82, 77, 64),
('Data Scientist', 'In-person', 5.8, 78, 72, 38);

-- Product Managers
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Product Manager', 'Remote', 6.5, 73, 66, 45),
('Product Manager', 'Hybrid', 6.2, 75, 69, 58),
('Product Manager', 'In-person', 6.7, 71, 64, 32);

-- Customer Service / Support
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Customer Service', 'Remote', 6.8, 69, 63, 82),
('Customer Service', 'Hybrid', 6.5, 71, 66, 54),
('Customer Service', 'In-person', 7.0, 67, 61, 76);

-- Finance / Accounting
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Finance', 'Remote', 6.2, 75, 68, 49),
('Finance', 'Hybrid', 5.9, 77, 71, 61),
('Finance', 'In-person', 6.4, 73, 66, 52);

-- Human Resources
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Human Resources', 'Remote', 6.0, 76, 70, 38),
('Human Resources', 'Hybrid', 5.7, 78, 73, 45),
('Human Resources', 'In-person', 6.2, 74, 68, 41);

-- Legal Professionals
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Legal', 'Remote', 7.1, 68, 60, 34),
('Legal', 'Hybrid', 6.8, 70, 63, 42),
('Legal', 'In-person', 7.3, 66, 58, 56);

-- Writers / Content Creators
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Writer', 'Remote', 5.7, 78, 73, 67),
('Writer', 'Hybrid', 5.4, 80, 76, 43),
('Writer', 'In-person', 5.9, 76, 71, 29);

-- Consultants
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Consultant', 'Remote', 6.4, 72, 67, 52),
('Consultant', 'Hybrid', 6.1, 74, 70, 68),
('Consultant', 'In-person', 6.6, 70, 65, 47);

-- Researchers / Scientists
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Researcher', 'Remote', 5.8, 77, 72, 41),
('Researcher', 'Hybrid', 5.5, 79, 75, 48),
('Researcher', 'In-person', 5.9, 76, 71, 56);

-- Executives / Managers
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Executive', 'Remote', 7.0, 69, 61, 38),
('Executive', 'Hybrid', 6.7, 71, 64, 52),
('Executive', 'In-person', 7.2, 67, 59, 61);

-- Engineers (Non-Software)
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Engineer', 'Remote', 5.9, 76, 70, 45),
('Engineer', 'Hybrid', 5.6, 78, 73, 58),
('Engineer', 'In-person', 6.1, 74, 68, 72);

-- Retail Workers
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Retail', 'Remote', 6.3, 71, 66, 12),
('Retail', 'Hybrid', 6.5, 70, 64, 18),
('Retail', 'In-person', 6.9, 67, 60, 94);

-- Hospitality Workers
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Hospitality', 'Remote', 6.1, 72, 67, 8),
('Hospitality', 'Hybrid', 6.4, 70, 65, 14),
('Hospitality', 'In-person', 7.1, 66, 59, 87);

-- Unemployed / Job Seeking
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Unemployed', 'Remote', 7.4, 58, 52, 34),
('Unemployed', 'Hybrid', 7.2, 60, 54, 21),
('Unemployed', 'In-person', 7.0, 62, 56, 18);

-- Retired
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Retired', 'Remote', 3.8, 85, 82, 23),
('Retired', 'Hybrid', 3.6, 87, 84, 15),
('Retired', 'In-person', 3.9, 84, 81, 28);

-- Graduate Students
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Graduate Student', 'Remote', 7.2, 66, 58, 42),
('Graduate Student', 'Hybrid', 6.9, 68, 61, 51),
('Graduate Student', 'In-person', 7.0, 67, 60, 63);

-- Entrepreneurs / Startup Founders
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Entrepreneur', 'Remote', 7.5, 65, 55, 38),
('Entrepreneur', 'Hybrid', 7.2, 67, 58, 29),
('Entrepreneur', 'In-person', 7.4, 66, 56, 24);

-- Artists / Musicians
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Artist', 'Remote', 6.0, 74, 68, 31),
('Artist', 'Hybrid', 5.7, 76, 71, 24),
('Artist', 'In-person', 6.2, 72, 66, 28);

-- Social Workers / Counselors
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Social Worker', 'Remote', 7.0, 68, 60, 29),
('Social Worker', 'Hybrid', 6.8, 69, 62, 34),
('Social Worker', 'In-person', 7.3, 66, 57, 48);

-- Construction Workers
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Construction', 'Remote', 5.2, 78, 74, 3),
('Construction', 'Hybrid', 5.5, 76, 71, 7),
('Construction', 'In-person', 6.3, 72, 66, 82);

-- Transportation / Drivers
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Transportation', 'Remote', 5.8, 74, 69, 5),
('Transportation', 'Hybrid', 6.1, 72, 67, 11),
('Transportation', 'In-person', 6.6, 69, 63, 76);

-- Administrative / Office Staff
INSERT INTO persona_benchmarks (occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count) VALUES
('Administrative', 'Remote', 5.5, 77, 72, 68),
('Administrative', 'Hybrid', 5.2, 79, 75, 79),
('Administrative', 'In-person', 5.7, 75, 70, 54);

-- Total rows: 93 persona combinations
-- Covers 31 occupations × 3 work modes each

-- Verify the data was inserted
SELECT COUNT(*) as total_personas FROM persona_benchmarks;

-- View sample data
SELECT occupation, work_mode, avg_stress, avg_productivity, avg_mental_wellness, count 
FROM persona_benchmarks 
ORDER BY occupation, work_mode
LIMIT 20;
