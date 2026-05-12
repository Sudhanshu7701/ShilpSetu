
-- Allow customers to update their own call requests (to mark as ended)
CREATE POLICY "Customers can update own call requests"
ON public.video_call_requests FOR UPDATE TO authenticated
USING (auth.uid() = customer_id);
