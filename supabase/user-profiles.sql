-- User Profiles Enhancement SQL
-- This file adds support for username, firstName, lastName and enhanced user profile management

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create or update user_profiles table with additional fields
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  notification_settings JSONB DEFAULT '{
    "expiryReminders": true,
    "expiredAlerts": true,
    "weeklyDigest": false,
    "marketingEmails": false
  }'::jsonb,
  privacy_settings JSONB DEFAULT '{
    "profileVisibility": "public",
    "showEmail": false,
    "showLocation": false
  }'::jsonb,
  preferences JSONB DEFAULT '{  
    "theme": "system",
    "language": "en",
    "dateFormat": "MM/DD/YYYY",
    "timeFormat": "12h"
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  CONSTRAINT first_name_length CHECK (char_length(first_name) >= 1),
  CONSTRAINT last_name_length CHECK (char_length(last_name) >= 1),
  CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (
    user_id,
    username,
    first_name,
    last_name,
    email
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
    COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Create trigger for username uniqueness
DROP TRIGGER IF EXISTS check_username_unique_trigger ON user_profiles;
CREATE TRIGGER check_username_unique_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION check_username_unique();

-- Grant permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;

-- Create view for public user profiles (without sensitive data)
CREATE OR REPLACE VIEW public_user_profiles AS
SELECT 
  id,
  username,
  first_name,
  last_name,
  avatar_url,
  bio,
  created_at
FROM user_profiles
WHERE privacy_settings->>'profileVisibility' = 'public';

-- Grant access to the view
GRANT SELECT ON public_user_profiles TO authenticated;
GRANT SELECT ON public_user_profiles TO anon;

-- Create function to get user profile by username
CREATE OR REPLACE FUNCTION get_user_profile_by_username(username_param TEXT)
RETURNS TABLE (
  id UUID,
  username VARCHAR(50),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.username,
    up.first_name,
    up.last_name,
    up.avatar_url,
    up.bio,
    up.created_at
  FROM user_profiles up
  WHERE up.username = username_param
  AND up.privacy_settings->>'profileVisibility' = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  username_param VARCHAR(50),
  first_name_param VARCHAR(100),
  last_name_param VARCHAR(100),
  bio_param TEXT DEFAULT NULL,
  avatar_url_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_profiles
  SET 
    username = username_param,
    first_name = first_name_param,
    last_name = last_name_param,
    bio = bio_param,
    avatar_url = avatar_url_param,
    updated_at = NOW()
  WHERE user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update notification settings
CREATE OR REPLACE FUNCTION update_notification_settings(settings JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_profiles
  SET 
    notification_settings = settings,
    updated_at = NOW()
  WHERE user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update privacy settings
CREATE OR REPLACE FUNCTION update_privacy_settings(settings JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_profiles
  SET 
    privacy_settings = settings,
    updated_at = NOW()
  WHERE user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user preferences
CREATE OR REPLACE FUNCTION update_user_preferences(preferences JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_profiles
  SET 
    preferences = preferences,
    updated_at = NOW()
  WHERE user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data (optional - remove in production)
-- INSERT INTO user_profiles (user_id, username, first_name, last_name, email) 
-- VALUES (
--   '00000000-0000-0000-0000-000000000000'::uuid,
--   'demo_user',
--   'Demo',
--   'User',
--   'demo@example.com'
-- );

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'Enhanced user profiles with username, names, and preferences';
COMMENT ON COLUMN user_profiles.username IS 'Unique username for the user (3-50 characters, alphanumeric + underscore)';
COMMENT ON COLUMN user_profiles.first_name IS 'User first name (1-100 characters)';
COMMENT ON COLUMN user_profiles.last_name IS 'User last name (1-100 characters)';
COMMENT ON COLUMN user_profiles.notification_settings IS 'JSON object containing notification preferences';
COMMENT ON COLUMN user_profiles.privacy_settings IS 'JSON object containing privacy preferences';
COMMENT ON COLUMN user_profiles.preferences IS 'JSON object containing user preferences (theme, language, etc.)';
