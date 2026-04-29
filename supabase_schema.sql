-- Phase 0: Database Setup
-- Run this in your Supabase SQL Editor

-- 1. Update existing `events` table with missing columns
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS current_supply integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS date_unix bigint,
ADD COLUMN IF NOT EXISTS capacity integer,
ADD COLUMN IF NOT EXISTS price_per_ticket bigint;

-- 2. Create `tickets` table
CREATE TABLE IF NOT EXISTS public.tickets (
  ticket_id text PRIMARY KEY,
  event_id text NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
  owner_address text NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  purchased_at timestamp with time zone DEFAULT now()
);

-- 3. Create `listings` table
CREATE TABLE IF NOT EXISTS public.listings (
  listing_id text PRIMARY KEY,
  seller_address text NOT NULL,
  ticket_id text NOT NULL REFERENCES public.tickets(ticket_id) ON DELETE CASCADE,
  event_id text NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
  ask_price_stroops bigint NOT NULL,
  status text NOT NULL DEFAULT 'Open',
  listed_at timestamp with time zone DEFAULT now()
);

-- 4. Create `user_profiles` table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  wallet_address text PRIMARY KEY,
  display_name text,
  email text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Create `app_cache` table (For Edge Function updates)
CREATE TABLE IF NOT EXISTS public.app_cache (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- 6. Set up basic RLS (Row Level Security)
-- Note: Assuming you are relying on anon-key public reads for now,
-- and authenticated/anon writes from the frontend. We will enable permissive 
-- rules to prevent frontend breakage, but in production you'd lock this down.

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users on events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users on events" ON public.events FOR UPDATE USING (true);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on tickets" ON public.tickets FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users on tickets" ON public.tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users on tickets" ON public.tickets FOR UPDATE USING (true);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on listings" ON public.listings FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users on listings" ON public.listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users on listings" ON public.listings FOR UPDATE USING (true);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on user_profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users on user_profiles" ON public.user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users on user_profiles" ON public.user_profiles FOR UPDATE USING (true);

ALTER TABLE public.app_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on app_cache" ON public.app_cache FOR SELECT USING (true);
-- Note: app_cache insert/update should ideally be limited to service_role (Edge Functions)
