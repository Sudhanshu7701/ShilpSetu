import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type SubscriptionTier = "free" | "normal" | "premium";

interface SubscriptionContextType {
  tier: SubscriptionTier;
  loading: boolean;
  isPremium: boolean;
  isNormal: boolean;
  isFree: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) { setTier("free"); setLoading(false); return; }

    // Try to sync with Stripe via check-subscription
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data?.tier) {
        setTier(data.tier as SubscriptionTier);
        setLoading(false);
        return;
      }
    } catch {
      // Fallback to DB
    }

    // Fallback: read from DB directly
    const { data } = await supabase
      .from("subscriptions")
      .select("tier")
      .eq("user_id", user.id)
      .maybeSingle();
    setTier((data?.tier as SubscriptionTier) || "free");
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  return (
    <SubscriptionContext.Provider value={{
      tier, loading,
      isPremium: tier === "premium",
      isNormal: tier === "normal",
      isFree: tier === "free",
      refreshSubscription: fetchSubscription,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
};
