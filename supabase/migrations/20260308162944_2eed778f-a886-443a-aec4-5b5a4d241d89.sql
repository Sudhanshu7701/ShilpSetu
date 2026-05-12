CREATE POLICY "Customers can cancel own orders within 24h"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = customer_id AND status = 'placed' AND created_at > now() - interval '1 day')
WITH CHECK (auth.uid() = customer_id AND status = 'cancelled');