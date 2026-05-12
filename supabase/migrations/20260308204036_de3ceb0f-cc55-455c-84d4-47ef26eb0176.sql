
-- Create verification_requests table
CREATE TABLE public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid NOT NULL,
  document_type text NOT NULL DEFAULT 'aadhaar',
  document_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid
);

-- Enable RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Artisans can submit verification requests
CREATE POLICY "Artisans can create verification requests"
ON public.verification_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = artisan_id);

-- Artisans can view their own requests
CREATE POLICY "Artisans can view own verification requests"
ON public.verification_requests FOR SELECT
TO authenticated
USING (auth.uid() = artisan_id);

-- Admins can view all verification requests
CREATE POLICY "Admins can view all verification requests"
ON public.verification_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update verification requests
CREATE POLICY "Admins can update verification requests"
ON public.verification_requests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for verification documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false);

-- Artisans can upload their own docs
CREATE POLICY "Artisans can upload verification docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Artisans can view their own docs
CREATE POLICY "Artisans can view own verification docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can view all verification docs
CREATE POLICY "Admins can view all verification docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'verification-docs' AND public.has_role(auth.uid(), 'admin'));
