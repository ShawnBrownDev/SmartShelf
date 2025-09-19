-- Complete signup trigger fix
-- This migration completely replaces the handle_new_user function with a robust version

-- First, drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a completely new, robust handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_username TEXT;
    user_first_name TEXT;
    user_last_name TEXT;
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 3;
BEGIN
    -- Extract metadata with proper fallbacks
    user_username := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
        'user_' || substr(NEW.id::text, 1, 8)
    );
    
    user_first_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'firstName'), ''),
        'User'
    );
    
    user_last_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'lastName'), ''),
        'Name'
    );
    
    -- Validate and sanitize username
    IF char_length(user_username) < 3 THEN
        user_username := 'user_' || substr(NEW.id::text, 1, 8);
    END IF;
    
    IF user_username !~ '^[a-zA-Z0-9_]+$' THEN
        user_username := 'user_' || substr(NEW.id::text, 1, 8);
    END IF;
    
    -- Ensure names are not empty
    IF char_length(user_first_name) = 0 THEN
        user_first_name := 'User';
    END IF;
    
    IF char_length(user_last_name) = 0 THEN
        user_last_name := 'Name';
    END IF;
    
    -- Attempt to create user profile with retry logic
    LOOP
        attempt_count := attempt_count + 1;
        
        BEGIN
            -- Create user profile
            INSERT INTO public.user_profiles (
                user_id,
                username,
                first_name,
                last_name,
                email
            ) VALUES (
                NEW.id,
                user_username,
                user_first_name,
                user_last_name,
                NEW.email
            );
            
            -- Create app settings
            INSERT INTO public.app_settings (user_id)
            VALUES (NEW.id);
            
            -- Success! Exit the loop
            EXIT;
            
        EXCEPTION
            WHEN unique_violation THEN
                -- Username conflict - generate a new one
                IF attempt_count < max_attempts THEN
                    user_username := 'user_' || substr(NEW.id::text, 1, 8) || '_' || 
                                   extract(epoch from now())::bigint % 10000 + attempt_count;
                    CONTINUE; -- Try again with new username
                ELSE
                    -- Max attempts reached, use a guaranteed unique username
                    user_username := 'user_' || NEW.id::text;
                    
                    INSERT INTO public.user_profiles (
                        user_id,
                        username,
                        first_name,
                        last_name,
                        email
                    ) VALUES (
                        NEW.id,
                        user_username,
                        user_first_name,
                        user_last_name,
                        NEW.email
                    );
                    
                    -- Create app settings
                    INSERT INTO public.app_settings (user_id)
                    VALUES (NEW.id);
                    
                    EXIT; -- Exit the loop
                END IF;
                
            WHEN OTHERS THEN
                -- Log the error but don't fail the signup
                RAISE LOG 'Error in handle_new_user (attempt %): %', attempt_count, SQLERRM;
                
                -- If we've tried enough times, give up on profile creation
                IF attempt_count >= max_attempts THEN
                    RAISE LOG 'Max attempts reached for user profile creation for user: %', NEW.id;
                    EXIT;
                END IF;
                
                -- Try again with a different username
                user_username := 'user_' || substr(NEW.id::text, 1, 8) || '_retry_' || attempt_count;
        END;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;