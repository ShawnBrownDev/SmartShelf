SmartShelf – Build Steps
1. Project Setup

 Initialize React Native project (Expo or bare).

 Install dependencies:

@supabase/supabase-js (Supabase client)

react-native-qrcode-svg (QR generation)

react-native-mlkit-barcode-scanner or react-native-camera (QR scanning)

expo-notifications (local push notifications)

 Configure Supabase project and connect client (supabase.ts).

2. Supabase Setup

 Create fridge_items table with fields:

id (uuid, PK)

user_id (uuid, FK to auth.users)

name (text)

category (text)

quantity (int)

expiry_date (date)

qr_code_id (text, unique identifier)

created_at (timestamp)

 Add Row Level Security (RLS): only owners can see/edit their items.

 Generate TypeScript types for fridge_items.

3. Authentication

 Add Supabase Auth (email + password).

 Create Login.tsx, Signup.tsx, and ForgotPassword.tsx.

 Handle session persistence (stay logged in).

4. Add Item Flow

 AddItem.tsx screen with form inputs: name, category, quantity, expiry_date.

 On submit → save to Supabase.

 Generate QR code from qr_code_id.

 Display QR code so user can print/stick it.

5. Scan Item Flow

 Scanner.tsx screen using ML Kit.

 Detect QR code → get qr_code_id.

 Lookup item in Supabase.

 Navigate to ItemDetail.tsx showing full details (expiry, qty, etc).

6. Dashboard

 Dashboard.tsx screen showing all items.

 Sort by expiry date (soonest at top).

 Use color coding:

Green = safe

Yellow = near expiry (3 days)

Red = expired

7. Notifications

 Use expo-notifications for reminders.

 Schedule notification 3 days before expiry.

 Schedule daily alert if item is expired.

8. Settings

 UserSettings.tsx for profile & logout.

 Notification toggle (on/off).

9. (Optional Phase 2 Features)

Shared fridge (invite family).

Recipe suggestions for near-expiry items.

Auto shopping list generator.

Barcode scanning (auto-fill product info).

Analytics (track reduced food waste).