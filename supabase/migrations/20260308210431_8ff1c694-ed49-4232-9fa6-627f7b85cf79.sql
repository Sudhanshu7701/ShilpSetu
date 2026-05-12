CREATE POLICY "Anyone can check pending verification status"
ON public.verification_requests
FOR SELECT
TO authenticated
USING (status = 'pending');