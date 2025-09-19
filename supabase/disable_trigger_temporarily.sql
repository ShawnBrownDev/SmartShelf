-- Temporarily disable the problematic trigger to allow signup to work
-- Run this in your Supabase SQL Editor

-- First, let's see what triggers exist
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name,
    tgenabled as enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'on_auth_user_created';

-- Disable the trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Check if it's disabled
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name,
    tgenabled as enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'on_auth_user_created';
