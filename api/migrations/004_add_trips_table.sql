-- Migration: Add trips table
-- Description: Store user trips with event, flight, and hotel details

-- Create trips table
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,

    -- Basic info
    title TEXT NOT NULL DEFAULT 'Untitled Trip',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'quoted', 'booked', 'completed', 'cancelled')),
    notes TEXT,

    -- Destination
    destination_city TEXT,
    destination_country TEXT,

    -- Event details
    event_name TEXT,
    event_date DATE,
    event_time TIME,
    event_provider TEXT,
    event_provider_id TEXT,
    event_venue TEXT,
    event_venue_address TEXT,
    event_price_estimate DECIMAL(10, 2),
    event_purchase_url TEXT,

    -- Flight details
    flight_offer_id TEXT,
    flight_origin TEXT,
    flight_destination TEXT,
    flight_outbound_date DATE,
    flight_outbound_time TIME,
    flight_return_date DATE,
    flight_return_time TIME,
    flight_price DECIMAL(10, 2),
    flight_carrier TEXT,
    flight_booking_ref TEXT,
    flight_purchase_url TEXT,

    -- Hotel details
    hotel_name TEXT,
    hotel_check_in DATE,
    hotel_check_out DATE,
    hotel_price DECIMAL(10, 2),
    hotel_purchase_url TEXT,

    -- Pricing
    estimated_total DECIMAL(10, 2),

    -- Quote tracking
    quoted_at TIMESTAMPTZ,
    quote_expires_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);

-- Enable RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own trips
CREATE POLICY "Users can view their own trips"
    ON public.trips FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trips"
    ON public.trips FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips"
    ON public.trips FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips"
    ON public.trips FOR DELETE
    USING (auth.uid() = user_id);

-- Service role bypass
CREATE POLICY "Service role can do anything on trips"
    ON public.trips FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_trips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trips_updated_at
    BEFORE UPDATE ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION update_trips_updated_at();
