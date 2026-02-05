-- Add event metadata, origin info, and ground transport to trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS event_image_url text;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS event_venue_lat float;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS event_venue_lng float;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS event_ticketmaster_id text;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS origin_city text;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS origin_airport_code text;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS ground_transport jsonb;
