ALTER TABLE instructors ADD COLUMN IF NOT EXISTS auth_email text UNIQUE;
