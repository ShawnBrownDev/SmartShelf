# Authentication System

## Overview
SmartShelf implements a complete authentication system using Supabase Auth with email and password authentication, including session persistence and password reset functionality.

## Features
- ✅ **Email/Password Authentication**: Secure login and signup
- ✅ **Session Persistence**: Users stay logged in across app restarts
- ✅ **Password Reset**: Email-based password reset functionality
- ✅ **Protected Routes**: Automatic redirect to login for unauthenticated users
- ✅ **Professional UI**: Modern, responsive authentication screens
- ✅ **Error Handling**: Comprehensive error messages and validation

## Database Setup (Step 2)

### Supabase Configuration
- **Client Setup**: Configured in `supabase/supabase.ts`
- **Environment Variables**: Uses `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY`
- **Session Storage**: AsyncStorage for persistent sessions

### Database Schema
Located in `supabase/schema.sql`:

```sql
-- user_profiles table for user data and settings
CREATE TABLE public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    notification_settings JSONB DEFAULT '{"expiryReminders": true, "expiredAlerts": true}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- fridge_items table with all required fields
CREATE TABLE public.fridge_items (
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
```

### Row Level Security (RLS)
- **User Isolation**: Users can only see/edit their own items and profiles
- **Automatic Policies**: SELECT, INSERT, UPDATE, DELETE policies for both tables
- **Security**: Prevents unauthorized access to user data
- **Profile Protection**: Complete isolation of user profile data

### TypeScript Types
Located in `types/database.ts`:
- **Database Types**: Complete type definitions for all tables including user_profiles
- **Form Types**: Type-safe form data interfaces
- **API Types**: Response and error handling types
- **User Types**: Extended user types with profile data

## Authentication Screens (Step 3)

### Login Screen (`screens/Login/Login.tsx`)
- **Email/Password Input**: Secure form with validation
- **Error Handling**: User-friendly error messages
- **Navigation**: Links to signup and forgot password
- **Loading States**: Visual feedback during authentication

### Signup Screen (`screens/Signup/Signup.tsx`)
- **Account Creation**: Email and password registration
- **Password Validation**: Minimum length and confirmation
- **Email Verification**: Automatic email verification flow
- **Success Handling**: Redirect to login after signup

### Forgot Password Screen (`screens/ForgotPassword/ForgotPassword.tsx`)
- **Email Input**: Password reset request
- **Email Confirmation**: Success state with instructions
- **Resend Option**: Ability to resend reset email
- **Navigation**: Back to login functionality

## Authentication Flow

### AuthWrapper Component
Located in `components/AuthWrapper.tsx`:
- **Route Protection**: Wraps main app tabs
- **Authentication Check**: Redirects unauthenticated users
- **Loading States**: Shows loading screen during auth check
- **Session Management**: Handles authentication state

### useAuth Hook
Located in `hooks/useAuth.ts`:
- **Session Management**: Tracks user authentication state
- **User Profile**: Manages user profile data and settings
- **Auto Refresh**: Automatically refreshes expired tokens
- **Sign Out**: Clean logout with session cleanup
- **Real-time Updates**: Listens for auth state changes
- **Profile Updates**: Methods to update user profile and notification settings

## Navigation Structure

### Auth Routes
- `/auth/login` - Login screen
- `/auth/signup` - Signup screen
- `/auth/forgot-password` - Password reset screen

### Protected Routes
- `/(tabs)` - Main app (protected by AuthWrapper)
- All tab screens require authentication

## Security Features

### Data Protection
- **RLS Policies**: Database-level security
- **User Isolation**: Complete data separation
- **Secure Storage**: Encrypted session storage
- **Token Management**: Automatic token refresh

### Input Validation
- **Email Format**: Proper email validation
- **Password Strength**: Minimum length requirements
- **Form Validation**: Client-side validation with error messages
- **Server Validation**: Supabase server-side validation

## User Experience

### Professional Design
- **Material Design**: Consistent with React Native Paper
- **Responsive Layout**: Works on all screen sizes
- **Loading States**: Visual feedback for all actions
- **Error Messages**: Clear, actionable error messages

### Accessibility
- **Keyboard Navigation**: Proper tab order
- **Screen Reader**: Accessible labels and descriptions
- **Touch Targets**: Adequate button sizes
- **Color Contrast**: Proper contrast ratios

## User Profile Management

### UserProfileService
Located in `services/userProfileService.ts`:
- **Profile CRUD**: Create, read, update, delete user profiles
- **Notification Settings**: Manage user notification preferences
- **Automatic Creation**: Profiles created automatically on signup
- **Data Validation**: Ensures data integrity and user isolation

### Automatic Profile Creation
- **Signup Trigger**: Database trigger creates profile on user registration
- **Default Settings**: Notification settings initialized with defaults
- **Data Sync**: Profile data synchronized with auth user data

## Integration Points

### Supabase Integration
- **Auth Service**: Complete Supabase Auth integration
- **Database**: Secure database access with RLS for both tables
- **Real-time**: Authentication state synchronization
- **Storage**: Persistent session management
- **Profile Management**: Complete user profile lifecycle management

### App Integration
- **Navigation**: Seamless routing between auth and app
- **State Management**: Global authentication state with profile data
- **Notifications**: Auth-aware notification system with user preferences
- **Settings**: User profile management and logout functionality
- **Data Persistence**: User settings stored in database, not just local storage

## Future Enhancements
- **Social Login**: Google, Apple, Facebook authentication
- **Biometric Auth**: Fingerprint/Face ID support
- **Two-Factor Auth**: Enhanced security options
- **Account Management**: Profile editing and preferences
