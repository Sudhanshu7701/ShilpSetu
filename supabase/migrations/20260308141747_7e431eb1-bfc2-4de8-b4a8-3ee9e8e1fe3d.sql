
-- Drop FK constraints so we can seed demo artisan data without auth accounts
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
