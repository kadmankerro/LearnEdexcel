-- Wipe all user progress data for fresh start
-- This will reset all user answers, progress, weak topics, and tutor sessions

-- Delete all user answers
DELETE FROM user_answers;

-- Delete all user progress
DELETE FROM user_progress;

-- Delete all weak topics tracking
DELETE FROM user_weak_topics;

-- Delete all tutor sessions
DELETE FROM tutor_sessions;

-- Delete all tutor memory
DELETE FROM tutor_mini_memory;

-- Optionally, reset user profiles but keep accounts
-- UPDATE profiles SET current_grade = NULL, target_grade = NULL, skill_level = NULL;

-- Verify deletion
SELECT 'user_answers' as table_name, COUNT(*) as remaining_rows FROM user_answers
UNION ALL
SELECT 'user_progress', COUNT(*) FROM user_progress
UNION ALL
SELECT 'user_weak_topics', COUNT(*) FROM user_weak_topics
UNION ALL
SELECT 'tutor_sessions', COUNT(*) FROM tutor_sessions
UNION ALL
SELECT 'tutor_mini_memory', COUNT(*) FROM tutor_mini_memory;
