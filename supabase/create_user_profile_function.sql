-- Create a function that bypasses RLS to create user profiles during signup
-- This function runs with SECURITY DEFINER so it bypasses RLS policies

CREATE OR REPLACE FUNCTION public.create_user_profile_on_signup(
    p_user_id UUID,
    p_username TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_email TEXT
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Create user profile
    INSERT INTO public.user_profiles (
        user_id,
        username,
        first_name,
        last_name,
        email
    ) VALUES (
        p_user_id,
        p_username,
        p_first_name,
        p_last_name,
        p_email
    );
    
    -- Create app settings
    INSERT INTO public.app_settings (user_id)
    VALUES (p_user_id);
    
    -- Return success
    result := json_build_object(
        'success', true,
        'message', 'Profile created successfully'
    );
    
    RETURN result;
    
EXCEPTION
    WHEN unique_violation THEN
        -- Handle username conflicts
        RETURN json_build_object(
            'success', false,
            'error', 'Username already exists',
            'message', 'This username is already taken. Please choose a different one.'
        );
    WHEN OTHERS THEN
        -- Handle other errors
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Failed to create user profile'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile_on_signup TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile_on_signup TO anon;
