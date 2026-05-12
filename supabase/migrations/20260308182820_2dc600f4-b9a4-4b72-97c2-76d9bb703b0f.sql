-- Allow artisans to create call requests (artisan calling customer)
CREATE POLICY "Artisans can create call requests"
ON public.video_call_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = artisan_id);

-- Add initiated_by column to track who started the call
ALTER TABLE public.video_call_requests ADD COLUMN initiated_by TEXT NOT NULL DEFAULT 'customer';
