// Database types for SmartShelf
// Generated from Supabase schema

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          first_name: string;
          last_name: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          bio: string | null;
          notification_settings: {
            expiryReminders: boolean;
            expiredAlerts: boolean;
            weeklyDigest: boolean;
            marketingEmails: boolean;
          };
          privacy_settings: {
            profileVisibility: string;
            showEmail: boolean;
            showLocation: boolean;
          };
          preferences: {
            theme: string;
            language: string;
            dateFormat: string;
            timeFormat: string;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          first_name: string;
          last_name: string;
          email: string;
          full_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          notification_settings?: {
            expiryReminders: boolean;
            expiredAlerts: boolean;
            weeklyDigest: boolean;
            marketingEmails: boolean;
          };
          privacy_settings?: {
            profileVisibility: string;
            showEmail: boolean;
            showLocation: boolean;
          };
          preferences?: {
            theme: string;
            language: string;
            dateFormat: string;
            timeFormat: string;
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          notification_settings?: {
            expiryReminders: boolean;
            expiredAlerts: boolean;
            weeklyDigest: boolean;
            marketingEmails: boolean;
          };
          privacy_settings?: {
            profileVisibility: string;
            showEmail: boolean;
            showLocation: boolean;
          };
          preferences?: {
            theme: string;
            language: string;
            dateFormat: string;
            timeFormat: string;
          };
          created_at?: string;
          updated_at?: string;
        };
      };
      fridge_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          quantity: number;
          expiry_date: string;
          qr_code_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category: string;
          quantity: number;
          expiry_date: string;
          qr_code_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string;
          quantity?: number;
          expiry_date?: string;
          qr_code_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      scheduled_notifications: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          notification_id: string;
          type: 'expiry-reminder' | 'expired-alert';
          scheduled_for: string;
          is_sent: boolean;
          is_cancelled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          notification_id: string;
          type: 'expiry-reminder' | 'expired-alert';
          scheduled_for: string;
          is_sent?: boolean;
          is_cancelled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          notification_id?: string;
          type?: 'expiry-reminder' | 'expired-alert';
          scheduled_for?: string;
          is_sent?: boolean;
          is_cancelled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      notification_history: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          notification_id: string;
          type: 'expiry-reminder' | 'expired-alert';
          sent_at: string;
          was_clicked: boolean;
          clicked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          notification_id: string;
          type: 'expiry-reminder' | 'expired-alert';
          sent_at: string;
          was_clicked?: boolean;
          clicked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          notification_id?: string;
          type?: 'expiry-reminder' | 'expired-alert';
          sent_at?: string;
          was_clicked?: boolean;
          clicked_at?: string | null;
          created_at?: string;
        };
      };
      app_settings: {
        Row: {
          id: string;
          user_id: string;
          theme: 'light' | 'dark' | 'system';
          language: string;
          first_launch: boolean;
          onboarding_completed: boolean;
          last_backup_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: 'light' | 'dark' | 'system';
          language?: string;
          first_launch?: boolean;
          onboarding_completed?: boolean;
          last_backup_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: 'light' | 'dark' | 'system';
          language?: string;
          first_launch?: boolean;
          onboarding_completed?: boolean;
          last_backup_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Convenience types
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

export type FridgeItem = Database['public']['Tables']['fridge_items']['Row'];
export type FridgeItemInsert = Database['public']['Tables']['fridge_items']['Insert'];
export type FridgeItemUpdate = Database['public']['Tables']['fridge_items']['Update'];

export type ScheduledNotification = Database['public']['Tables']['scheduled_notifications']['Row'];
export type ScheduledNotificationInsert = Database['public']['Tables']['scheduled_notifications']['Insert'];
export type ScheduledNotificationUpdate = Database['public']['Tables']['scheduled_notifications']['Update'];

export type NotificationHistory = Database['public']['Tables']['notification_history']['Row'];
export type NotificationHistoryInsert = Database['public']['Tables']['notification_history']['Insert'];
export type NotificationHistoryUpdate = Database['public']['Tables']['notification_history']['Update'];

export type AppSettings = Database['public']['Tables']['app_settings']['Row'];
export type AppSettingsInsert = Database['public']['Tables']['app_settings']['Insert'];
export type AppSettingsUpdate = Database['public']['Tables']['app_settings']['Update'];

// Extended types with computed properties
export interface FridgeItemWithStatus extends FridgeItem {
  expiryStatus: 'safe' | 'near-expiry' | 'expired';
  daysUntilExpiry: number;
}

// Category types
export type ItemCategory = 
  | 'Dairy'
  | 'Meat'
  | 'Vegetables'
  | 'Fruits'
  | 'Grains'
  | 'Beverages'
  | 'Snacks'
  | 'Frozen'
  | 'Other';

// Notification types
export interface NotificationData {
  itemId: string;
  itemName: string;
  expiryDate: string;
  type: 'expiry-reminder' | 'expired-alert';
}

// User types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Extended user with profile
export interface UserWithProfile extends User {
  profile?: UserProfile;
}

// Settings types
export interface NotificationSettings {
  expiryReminders: boolean;
  expiredAlerts: boolean;
}

// App settings types
export interface AppSettingsData {
  theme: 'light' | 'dark' | 'system';
  language: string;
  firstLaunch: boolean;
  onboardingCompleted: boolean;
  lastBackupAt: string | null;
}

// Notification types
export interface NotificationScheduleData {
  itemId: string;
  itemName: string;
  expiryDate: string;
  type: 'expiry-reminder' | 'expired-alert';
  scheduledFor: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Form types
export interface AddItemFormData {
  name: string;
  category: string;
  quantity: string;
  expiryDate: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface ForgotPasswordFormData {
  email: string;
}
