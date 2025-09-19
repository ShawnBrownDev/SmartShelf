-- SmartShelf Database Schema
-- This file contains the SQL commands to set up the database tables and security policies

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    username VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    avatar_url TEXT,
    bio TEXT,
    notification_settings JSONB DEFAULT '{"expiryReminders": true, "expiredAlerts": true, "weeklyDigest": false, "marketingEmails": false}'::jsonb,
    privacy_settings JSONB DEFAULT '{"profileVisibility": "public", "showEmail": false, "showLocation": false}'::jsonb,
    preferences JSONB DEFAULT '{"theme": "system", "language": "en", "dateFormat": "MM/DD/YYYY", "timeFormat": "12h"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT username_length CHECK (char_length(username) >= 3),
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$'),
    CONSTRAINT first_name_length CHECK (char_length(first_name) >= 1),
    CONSTRAINT last_name_length CHECK (char_length(last_name) >= 1)
);

-- Create fridge_items table
CREATE TABLE IF NOT EXISTS public.fridge_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    expiry_date DATE NOT NULL,
    qr_code_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create scheduled_notifications table
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES public.fridge_items(id) ON DELETE CASCADE NOT NULL,
    notification_id TEXT NOT NULL, -- Device notification ID
    type TEXT NOT NULL CHECK (type IN ('expiry-reminder', 'expired-alert')),
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    is_cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create notification_history table
CREATE TABLE IF NOT EXISTS public.notification_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES public.fridge_items(id) ON DELETE CASCADE NOT NULL,
    notification_id TEXT NOT NULL, -- Device notification ID
    type TEXT NOT NULL CHECK (type IN ('expiry-reminder', 'expired-alert')),
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    was_clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language TEXT DEFAULT 'en',
    first_launch BOOLEAN DEFAULT TRUE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    last_backup_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_fridge_items_user_id ON public.fridge_items(user_id);
CREATE INDEX IF NOT EXISTS idx_fridge_items_expiry_date ON public.fridge_items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_fridge_items_qr_code_id ON public.fridge_items(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON public.scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_item_id ON public.scheduled_notifications(item_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON public.scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON public.notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_item_id ON public.notification_history(item_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON public.notification_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_app_settings_user_id ON public.app_settings(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fridge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
-- Policy: Users can only see their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own profile
CREATE POLICY "Users can delete own profile" ON public.user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for fridge_items
-- Policy: Users can only see their own items
CREATE POLICY "Users can view own items" ON public.fridge_items
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own items
CREATE POLICY "Users can insert own items" ON public.fridge_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own items
CREATE POLICY "Users can update own items" ON public.fridge_items
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own items
CREATE POLICY "Users can delete own items" ON public.fridge_items
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for scheduled_notifications
-- Policy: Users can only see their own scheduled notifications
CREATE POLICY "Users can view own scheduled notifications" ON public.scheduled_notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own scheduled notifications
CREATE POLICY "Users can insert own scheduled notifications" ON public.scheduled_notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own scheduled notifications
CREATE POLICY "Users can update own scheduled notifications" ON public.scheduled_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own scheduled notifications
CREATE POLICY "Users can delete own scheduled notifications" ON public.scheduled_notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for notification_history
-- Policy: Users can only see their own notification history
CREATE POLICY "Users can view own notification history" ON public.notification_history
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own notification history
CREATE POLICY "Users can insert own notification history" ON public.notification_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own notification history
CREATE POLICY "Users can update own notification history" ON public.notification_history
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own notification history
CREATE POLICY "Users can delete own notification history" ON public.notification_history
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for app_settings
-- Policy: Users can only see their own app settings
CREATE POLICY "Users can view own app settings" ON public.app_settings
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own app settings
CREATE POLICY "Users can insert own app settings" ON public.app_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own app settings
CREATE POLICY "Users can update own app settings" ON public.app_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own app settings
CREATE POLICY "Users can delete own app settings" ON public.app_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at for user_profiles
CREATE TRIGGER handle_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger to automatically update updated_at for fridge_items
CREATE TRIGGER handle_fridge_items_updated_at
    BEFORE UPDATE ON public.fridge_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger to automatically update updated_at for scheduled_notifications
CREATE TRIGGER handle_scheduled_notifications_updated_at
    BEFORE UPDATE ON public.scheduled_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger to automatically update updated_at for app_settings
CREATE TRIGGER handle_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.fridge_items TO anon, authenticated;
GRANT ALL ON public.scheduled_notifications TO anon, authenticated;
GRANT ALL ON public.notification_history TO anon, authenticated;
GRANT ALL ON public.app_settings TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create function to automatically create user profile and app settings on signup
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

-- Create trigger to automatically create user profile and app settings
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
