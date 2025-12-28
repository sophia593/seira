-- ============================================================================
-- SEIRA MVP DATABASE SCHEMA
-- Safe for Supabase SQL Editor. Idempotent (re-runnable).
-- Uses pgcrypto + gen_random_uuid() and hardened SECURITY DEFINER triggers.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) EXTENSIONS
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 2) ENUM TYPES
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_status') THEN
    CREATE TYPE trip_status AS ENUM ('draft','quoted','booked','completed','cancelled');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_role') THEN
    CREATE TYPE message_role AS ENUM ('system','user','assistant','tool');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cabin_class') THEN
    CREATE TYPE cabin_class AS ENUM ('economy','premium_economy','business','first');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seat_preference') THEN
    CREATE TYPE seat_preference AS ENUM ('window','aisle','middle','no_preference');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3) TABLES
-- ---------------------------------------------------------------------------

-- USERS (profile table synced from auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USER PREFERENCES (1:1 with users)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  home_airport TEXT,
  preferred_airlines TEXT[],
  seat_preference seat_preference DEFAULT 'no_preference',
  cabin_class cabin_class DEFAULT 'economy',
  budget_default INTEGER,
  dietary_restrictions TEXT[],
  notification_email BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_home_airport CHECK (
    home_airport IS NULL OR (length(home_airport) = 3 AND home_airport = upper(home_airport))
  ),
  CONSTRAINT valid_budget CHECK (budget_default IS NULL OR budget_default >= 0)
);

-- CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  message_count INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  tool_calls JSONB,
  tool_call_id TEXT,
  tokens_used INTEGER,
  model_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_tokens CHECK (tokens_used IS NULL OR tokens_used >= 0)
);

-- TRIPS
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  status trip_status NOT NULL DEFAULT 'draft',
  notes TEXT,

  destination_city TEXT,
  destination_country TEXT,

  event_name TEXT,
  event_date DATE,
  event_time TIME,
  event_provider TEXT,
  event_provider_id TEXT,
  event_venue TEXT,
  event_venue_address TEXT,
  event_price_estimate INTEGER,
  event_purchase_url TEXT,

  flight_offer_id TEXT,
  flight_origin TEXT,
  flight_destination TEXT,
  flight_outbound_date DATE,
  flight_outbound_time TIME,
  flight_return_date DATE,
  flight_return_time TIME,
  flight_price INTEGER,
  flight_carrier TEXT,
  flight_booking_ref TEXT,
  flight_purchase_url TEXT,

  hotel_name TEXT,
  hotel_check_in DATE,
  hotel_check_out DATE,
  hotel_price INTEGER,
  hotel_purchase_url TEXT,

  estimated_total INTEGER,

  quoted_at TIMESTAMPTZ,
  quote_expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_flight_airports CHECK (
    (flight_origin IS NULL OR (length(flight_origin) = 3 AND flight_origin = upper(flight_origin))) AND
    (flight_destination IS NULL OR (length(flight_destination) = 3 AND flight_destination = upper(flight_destination)))
  ),
  CONSTRAINT valid_prices CHECK (
    (event_price_estimate IS NULL OR event_price_estimate >= 0) AND
    (flight_price IS NULL OR flight_price >= 0) AND
    (hotel_price IS NULL OR hotel_price >= 0) AND
    (estimated_total IS NULL OR estimated_total >= 0)
  ),
  CONSTRAINT valid_dates CHECK (
    flight_return_date IS NULL OR
    flight_outbound_date IS NULL OR
    flight_return_date >= flight_outbound_date
  )
);

-- ---------------------------------------------------------------------------
-- 4) INDEXES (query patterns)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Conversations: list for a user by updated_at, excluding archived
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
  ON public.conversations(user_id, updated_at DESC)
  WHERE NOT is_archived;

-- Messages: by conversation ordered by created_at
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages(conversation_id, created_at ASC);

-- Trips: by user and status
CREATE INDEX IF NOT EXISTS idx_trips_user_status
  ON public.trips(user_id, status);

-- Trips: by user + event_date for upcoming sorting
CREATE INDEX IF NOT EXISTS idx_trips_user_eventdate_active
  ON public.trips(user_id, event_date ASC)
  WHERE status IN ('draft','quoted','booked') AND event_date IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5) FUNCTIONS
-- ---------------------------------------------------------------------------

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Sync auth.users -> public.users and auto-create user_preferences
CREATE OR REPLACE FUNCTION public.handle_auth_user_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.users (id, email, name, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
      ),
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_preferences (user_id, created_at, updated_at)
    VALUES (NEW.id, now(), now())
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.users u
    SET
      email = NEW.email,
      name = COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        u.name
      ),
      updated_at = now()
    WHERE u.id = NEW.id;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- Maintain conversations.message_count and updated_at when messages change
CREATE OR REPLACE FUNCTION public.update_conversation_message_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.conversations
    SET message_count = message_count + 1,
        updated_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.conversations
    SET message_count = GREATEST(message_count - 1, 0),
        updated_at = now()
    WHERE id = OLD.conversation_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- Enforce that trips.conversation_id (if set) belongs to same user_id
CREATE OR REPLACE FUNCTION public.enforce_trip_conversation_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.conversation_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = NEW.conversation_id
      AND c.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Trip conversation_id does not belong to trip user_id';
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6) TRIGGERS
-- ---------------------------------------------------------------------------

-- Auth sync triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auth_user_change();

CREATE TRIGGER on_auth_user_updated
AFTER UPDATE OF email, raw_user_meta_data ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auth_user_change();

-- updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
DROP TRIGGER IF EXISTS update_trips_updated_at ON public.trips;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- message_count triggers
DROP TRIGGER IF EXISTS on_message_insert ON public.messages;
DROP TRIGGER IF EXISTS on_message_delete ON public.messages;

CREATE TRIGGER on_message_insert
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_message_count();

CREATE TRIGGER on_message_delete
AFTER DELETE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_message_count();

-- trip ownership trigger
DROP TRIGGER IF EXISTS trips_enforce_conversation_owner ON public.trips;

CREATE TRIGGER trips_enforce_conversation_owner
BEFORE INSERT OR UPDATE OF conversation_id, user_id ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.enforce_trip_conversation_owner();

-- ---------------------------------------------------------------------------
-- 7) ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;

DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in own conversations" ON public.messages;

DROP POLICY IF EXISTS "Users can view own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can create own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can update own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON public.trips;

-- USERS
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- USER PREFERENCES
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CONVERSATIONS
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON public.conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- MESSAGES (ownership via conversation join, append-only)
CREATE POLICY "Users can view messages in own conversations"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );

-- TRIPS
CREATE POLICY "Users can view own trips"
  ON public.trips FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trips"
  ON public.trips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON public.trips FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON public.trips FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 8) GRANTS
-- ---------------------------------------------------------------------------

-- Revoke all from anon (no public access)
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.user_preferences FROM anon;
REVOKE ALL ON public.conversations FROM anon;
REVOKE ALL ON public.messages FROM anon;
REVOKE ALL ON public.trips FROM anon;

-- Grant to authenticated (RLS enforces row-level access)
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;

-- Service role has full access (bypasses RLS)
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.user_preferences TO service_role;
GRANT ALL ON public.conversations TO service_role;
GRANT ALL ON public.messages TO service_role;
GRANT ALL ON public.trips TO service_role;

-- ============================================================================
-- END
-- ============================================================================
