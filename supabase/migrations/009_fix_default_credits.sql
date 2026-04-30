-- Fix: Change default credits for new users from 50 to 10
ALTER TABLE users ALTER COLUMN credits SET DEFAULT 10;
