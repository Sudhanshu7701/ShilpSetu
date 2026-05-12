
-- Add branding fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_tagline text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_color text DEFAULT '#8B5E3C';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_logo_url text;

-- Create loyalty_points table
CREATE TABLE public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  lifetime_points integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own points" ON public.loyalty_points FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own points" ON public.loyalty_points FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own points" ON public.loyalty_points FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create unique index on user_id
CREATE UNIQUE INDEX loyalty_points_user_id_idx ON public.loyalty_points(user_id);

-- Create loyalty_transactions table for history
CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL,
  type text NOT NULL DEFAULT 'earn',
  description text,
  order_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions" ON public.loyalty_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert transactions" ON public.loyalty_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Function to award loyalty points on order placement
CREATE OR REPLACE FUNCTION public.award_loyalty_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  earned_points integer;
BEGIN
  -- 1 point per ₹100 spent
  earned_points := GREATEST(1, FLOOR(NEW.total_amount / 100));
  
  INSERT INTO public.loyalty_points (user_id, points, lifetime_points)
  VALUES (NEW.customer_id, earned_points, earned_points)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    points = loyalty_points.points + earned_points,
    lifetime_points = loyalty_points.lifetime_points + earned_points,
    updated_at = now();
  
  INSERT INTO public.loyalty_transactions (user_id, points, type, description, order_id)
  VALUES (NEW.customer_id, earned_points, 'earn', 'Order placed - earned ' || earned_points || ' points', NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_award_points
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.award_loyalty_points();
