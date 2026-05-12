-- Create return_requests table
CREATE TABLE public.return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  customer_id uuid NOT NULL,
  reason text NOT NULL,
  evidence_urls text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

-- Customers can create return requests for their own orders
CREATE POLICY "Customers can create return requests"
ON public.return_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = customer_id);

-- Customers can view their own return requests
CREATE POLICY "Customers can view own return requests"
ON public.return_requests FOR SELECT TO authenticated
USING (auth.uid() = customer_id);

-- Artisans can view return requests for their orders
CREATE POLICY "Artisans can view return requests for their orders"
ON public.return_requests FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders WHERE orders.id = return_requests.order_id AND orders.artisan_id = auth.uid()
));

-- Admins can view and manage all return requests
CREATE POLICY "Admins can manage return requests"
ON public.return_requests FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for return evidence
INSERT INTO storage.buckets (id, name, public) VALUES ('return-evidence', 'return-evidence', true);

-- Storage policies for return evidence
CREATE POLICY "Authenticated users can upload return evidence"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'return-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view return evidence"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'return-evidence');