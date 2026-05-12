
-- Create subscription tiers enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'normal', 'premium');

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "Users can read own subscription"
ON public.subscriptions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage subscriptions"
ON public.subscriptions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create daily message count tracking table
CREATE TABLE public.daily_message_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, message_date)
);

ALTER TABLE public.daily_message_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own message counts"
ON public.daily_message_counts FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own message counts"
ON public.daily_message_counts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own message counts"
ON public.daily_message_counts FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Auto-create free subscription for new users via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, tier)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();
