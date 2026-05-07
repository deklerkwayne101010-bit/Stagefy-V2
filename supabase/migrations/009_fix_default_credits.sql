-- Fix: Change default credits for new users from 50 to 3
ALTER TABLE users ALTER COLUMN credits SET DEFAULT 3;
