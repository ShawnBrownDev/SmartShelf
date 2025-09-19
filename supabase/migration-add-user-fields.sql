-- Migration: Add username, firstName, lastName to existing user_profiles table
-- Run this if you get "column username does not exist" error

-- First, let's check if the columns already exist and add them if they don't
DO $$ 
BEGIN
    -- Add username column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'username') THEN
        ALTER TABLE public.user_profiles ADD COLUMN username VARCHAR(50);
    END IF;
    
    -- Add first_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'first_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN first_name VARCHAR(100);
    END IF;
    
    -- Add last_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'last_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN last_name VARCHAR(100);
    END IF;
    
    -- Add bio column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'bio') THEN
        ALTER TABLE public.user_profiles ADD COLUMN bio TEXT;
    END IF;
    
    -- Add privacy_settings column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'privacy_settings') THEN
        ALTER TABLE public.user_profiles ADD COLUMN privacy_settings JSONB DEFAULT '{"profileVisibility": "public", "showEmail": false, "showLocation": false}'::jsonb;
    END IF;
    
    -- Add preferences column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'preferences') THEN
        ALTER TABLE public.user_profiles ADD COLUMN preferences JSONB DEFAULT '{"theme": "system", "language": "en", "dateFormat": "MM/DD/YYYY", "timeFormat": "12h"}'::jsonb;
    END IF;
END $$;

-- Update existing notification_settings to include new fields if they don't exist
UPDATE public.user_profiles 
SET notification_settings = notification_settings || '{"weeklyDigest": false, "marketingEmails": false}'::jsonb
WHERE notification_settings IS NOT NULL;

-- Generate usernames for existing users who don't have one
UPDATE public.user_profiles 
SET username = 'user_' || substr(user_id::text, 1, 8)
WHERE username IS NULL OR username = '';

-- Generate first_name and last_name from full_name if they exist
UPDATE public.user_profiles 
SET 
    first_name = CASE 
        WHEN full_name IS NOT NULL AND full_name != '' THEN 
            split_part(full_name, ' ', 1)
        ELSE 'User'
    END,
    last_name = CASE 
        WHEN full_name IS NOT NULL AND full_name != '' AND position(' ' in full_name) > 0 THEN 
            substring(full_name from position(' ' in full_name) + 1)
        WHEN full_name IS NOT NULL AND full_name != '' THEN 
            ''
        ELSE 'User'
    END
WHERE first_name IS NULL OR first_name = '' OR last_name IS NULL OR last_name = '';

-- Now add constraints
DO $$ 
BEGIN
    -- Add username constraints if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'username_length') THEN
        ALTER TABLE public.user_profiles ADD CONSTRAINT username_length CHECK (char_length(username) >= 3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'username_format') THEN
        ALTER TABLE public.user_profiles ADD CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$');
    END IF;
    
    -- Add name constraints if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'first_name_length') THEN
        ALTER TABLE public.user_profiles ADD CONSTRAINT first_name_length CHECK (char_length(first_name) >= 1);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'last_name_length') THEN
        ALTER TABLE public.user_profiles ADD CONSTRAINT last_name_length CHECK (char_length(last_name) >= 1);
    END IF;
END $$;

-- Make username unique if it's not already
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'user_profiles_username_key') THEN
        ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_username_key UNIQUE (username);
    END IF;
END $$;

-- Make username NOT NULL if it's not already
ALTER TABLE public.user_profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE public.user_profiles ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE public.user_profiles ALTER COLUMN last_name SET NOT NULL;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile with new fields
    INSERT INTO public.user_profiles (
        user_id, 
        username, 
        first_name, 
        last_name, 
        email
    )
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
        COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
        NEW.email
    );
    
    -- Create app settings
    INSERT INTO public.app_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check username uniqueness
CREATE OR REPLACE FUNCTION check_username_unique()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE username = NEW.username 
    AND user_id != NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Username already exists';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for username uniqueness if it doesn't exist
DROP TRIGGER IF EXISTS check_username_unique_trigger ON public.user_profiles;
CREATE TRIGGER check_username_unique_trigger
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION check_username_unique();

-- Grant permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO anon;

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;


