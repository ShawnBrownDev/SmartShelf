# Database Setup Guide

## Quick Setup

### Option 1: Run Complete Schema (Recommended)
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Click "Run" to execute all commands at once

### Option 2: Step-by-Step Setup
If you encounter errors with the complete schema:
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `supabase/schema-step-by-step.sql`
4. Run each step individually (separate each step with comments)

## Common Issues & Solutions

### Error: "unrecognized configuration parameter"
**Problem**: JWT secret configuration error
**Solution**: The JWT secret line has been removed from the schema. Supabase handles this automatically.

### Error: "relation does not exist"
**Problem**: Tables referenced before creation
**Solution**: Run the schema in order, or use the step-by-step version

### Error: "permission denied"
**Problem**: Insufficient permissions
**Solution**: Ensure you're running as the database owner or with proper permissions

### Error: "function already exists"
**Problem**: Schema already partially applied
**Solution**: Use `CREATE OR REPLACE FUNCTION` or drop existing functions first

## Verification

### Check Tables Created
Run this query to verify all tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_profiles', 
    'fridge_items', 
    'scheduled_notifications', 
    'notification_history', 
    'app_settings'
);
```

### Check RLS Policies
Run this query to verify RLS is enabled:
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'user_profiles', 
    'fridge_items', 
    'scheduled_notifications', 
    'notification_history', 
    'app_settings'
);
```

### Check Indexes
Run this query to verify indexes were created:
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
```

## Environment Variables

### Required Environment Variables
Add these to your `.env` file or Expo configuration:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Finding Your Supabase Credentials
1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy the "Project URL" and "anon public" key

## Testing the Setup

### Test User Creation
1. Sign up a new user through your app
2. Check if user profile and app settings were created automatically:
```sql
SELECT * FROM user_profiles WHERE email = 'test@example.com';
SELECT * FROM app_settings WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
```

### Test Item Creation
1. Add a new item through your app
2. Verify it was created:
```sql
SELECT * FROM fridge_items WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
```

## Troubleshooting

### Reset Database (Development Only)
⚠️ **WARNING**: This will delete all data!

```sql
-- Drop all tables
DROP TABLE IF EXISTS public.app_settings CASCADE;
DROP TABLE IF EXISTS public.notification_history CASCADE;
DROP TABLE IF EXISTS public.scheduled_notifications CASCADE;
DROP TABLE IF EXISTS public.fridge_items CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
```

Then re-run the schema setup.

### Check for Conflicts
If you have existing data or tables:
```sql
-- Check existing tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check existing functions
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
```

## Production Considerations

### Backup Strategy
- Enable automatic backups in Supabase
- Test restore procedures
- Document backup schedules

### Monitoring
- Set up database monitoring
- Monitor query performance
- Track error rates

### Security
- Review RLS policies regularly
- Audit user permissions
- Monitor access patterns

## Support

### Supabase Documentation
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
- [Triggers](https://supabase.com/docs/guides/database/triggers)

### Common Commands
```sql
-- Check current user
SELECT auth.uid();

-- Check user permissions
SELECT * FROM information_schema.table_privileges WHERE grantee = 'authenticated';

-- View all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies WHERE schemaname = 'public';
```



