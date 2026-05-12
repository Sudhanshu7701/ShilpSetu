CREATE TABLE public.live_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer DEFAULT 60,
  status text NOT NULL DEFAULT 'scheduled',
  viewers_count integer DEFAULT 0,
  thumbnail_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone" ON public.live_events FOR SELECT USING (true);
CREATE POLICY "Artisans can manage own events" ON public.live_events FOR INSERT WITH CHECK (auth.uid() = artisan_id AND has_role(auth.uid(), 'artisan'::app_role));
CREATE POLICY "Artisans can update own events" ON public.live_events FOR UPDATE USING (auth.uid() = artisan_id);
CREATE POLICY "Artisans can delete own events" ON public.live_events FOR DELETE USING (auth.uid() = artisan_id);