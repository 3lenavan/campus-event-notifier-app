# Supabase Migration - Database Schema

This document outlines the Supabase database schema required after migrating from localStorage to Supabase.

## Tables Required

### 1. `clubs` Table
Stores club information with verification codes.

```sql
CREATE TABLE clubs (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT,
  code_hash TEXT,              -- Legacy verification code hash
  code_hash_member TEXT,        -- Member verification code hash
  code_hash_moderator TEXT,    -- Moderator verification code hash
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. `user_profiles` Table
Stores user profile information including memberships and roles.

```sql
CREATE TABLE user_profiles (
  uid TEXT PRIMARY KEY,         -- Firebase Auth UID
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'student',  -- 'student' or 'member'
  memberships TEXT[],           -- Array of club IDs
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. `events` Table
Stores event information with moderation status.

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  club_id INTEGER NOT NULL REFERENCES clubs(id),
  date_iso TEXT NOT NULL,       -- ISO date string
  location TEXT NOT NULL,
  created_by TEXT NOT NULL,      -- Firebase UID
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  moderation_note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_club_id ON events(club_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date_iso ON events(date_iso);
```

### 4. `saved_events` Table
Stores user's saved/favorited events.

```sql
CREATE TABLE saved_events (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,        -- Firebase UID
  event_id INTEGER NOT NULL REFERENCES events(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

CREATE INDEX idx_saved_events_user_id ON saved_events(user_id);
CREATE INDEX idx_saved_events_event_id ON saved_events(event_id);
```

### 5. `event_policy` Table
Stores global event creation policy settings.

```sql
CREATE TABLE event_policy (
  id INTEGER PRIMARY KEY DEFAULT 1,
  enabled_global BOOLEAN DEFAULT TRUE,
  enabled_by_club JSONB DEFAULT '{}',  -- Map of club_id -> boolean
  moderation_mode TEXT DEFAULT 'off',  -- 'off' or 'clubModerator'
  limits JSONB DEFAULT '{
    "max_per_club_per_day": 5,
    "user_cooldown_minutes": 30,
    "allow_images": true,
    "max_image_mb": 5,
    "max_title_len": 100,
    "max_desc_len": 500
  }',
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Row Level Security (RLS)

You should configure RLS policies based on your security requirements. Here are some recommendations:

### Events
- **Select**: Anyone can read approved events, users can read their own pending events
- **Insert**: Authenticated users can create events
- **Update**: Only event creators or admins can update events
- **Delete**: Only admins can delete events

### User Profiles
- **Select**: Users can read their own profile
- **Insert/Update**: Users can create/update their own profile
- **Delete**: Only admins can delete profiles

### Saved Events
- **Select**: Users can only read their own saved events
- **Insert/Delete**: Users can only manage their own saved events

### Event Policy
- **Select**: Anyone can read (public settings)
- **Update**: Only admins can update

## Migration Notes

1. **Club IDs**: The app uses string IDs in the TypeScript interface, but Supabase uses integer IDs. The service layer handles conversion.

2. **Event IDs**: Events use auto-incrementing integer IDs in Supabase, converted to strings in the app.

3. **Notification State**: Per-user notification tracking (which events have been notified) is still stored in AsyncStorage as it's device-specific state, not shared data.

4. **Existing Data**: If you have existing localStorage data, you'll need to create a migration script to import it into Supabase.

## Environment Variables

Make sure to set these in your `.env` file:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing

After setting up the tables, test the following:
1. Club seeding from JSON file
2. User profile creation/updates
3. Event creation and moderation
4. Club membership verification
5. Saved events functionality

