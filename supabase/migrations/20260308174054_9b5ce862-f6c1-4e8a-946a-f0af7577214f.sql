
-- Video call request table for notification/approval flow
CREATE TABLE public.video_call_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  artisan_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  room_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.video_call_requests ENABLE ROW LEVEL SECURITY;

-- Customers can create requests
CREATE POLICY "Customers can create call requests"
ON public.video_call_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = customer_id);

-- Both parties can view their requests
CREATE POLICY "Users can view own call requests"
ON public.video_call_requests FOR SELECT TO authenticated
USING (auth.uid() = customer_id OR auth.uid() = artisan_id);

-- Artisans can accept/decline
CREATE POLICY "Artisans can update call requests"
ON public.video_call_requests FOR UPDATE TO authenticated
USING (auth.uid() = artisan_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_call_requests;
