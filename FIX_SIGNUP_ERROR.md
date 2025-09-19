# Fix Signup Database Error

## Problem
The signup process is failing with "Database error saving new user" because the database trigger function `handle_new_user()` is not handling edge cases properly.

## Root Cause
The database trigger function that automatically creates user profiles when a new user signs up has several issues:

1. **Username constraints**: The function doesn't properly validate usernames against the database constraints (length >= 3, alphanumeric + underscore only)
2. **Name constraints**: Empty first/last names can cause NOT NULL constraint violations
3. **Unique constraint handling**: No proper handling of username conflicts
4. **Error handling**: No robust error handling for constraint violations

## Solution

### Step 1: Apply Database Migration
You need to apply the updated trigger function to your Supabase database. You can do this in two ways:

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/migrations/20241220_fix_signup_trigger.sql`
4. Execute the SQL

#### Option B: Using Supabase CLI
```bash
# If you have Supabase CLI installed and configured
npx supabase db push
```

### Step 2: Test the Fix
After applying the migration, try signing up with a new user account. The signup should now work properly.

## What the Fix Does

The updated `handle_new_user()` function now:

1. **Validates usernames**: Ensures they meet length and character requirements
2. **Handles empty names**: Provides default values if first/last names are empty
3. **Handles username conflicts**: If a username already exists, it generates a unique alternative
4. **Robust error handling**: Catches and handles constraint violations gracefully
5. **Logging**: Logs errors for debugging purposes

## Testing

Try signing up with various edge cases:
- Very short usernames
- Usernames with special characters
- Empty first/last names
- Duplicate usernames

All should now work without database errors.

## Additional Notes

- The function is marked as `SECURITY DEFINER` so it bypasses RLS policies
- It automatically creates both user profiles and app settings
- Username conflicts are resolved by appending a timestamp-based suffix
- All database constraints are properly handled
