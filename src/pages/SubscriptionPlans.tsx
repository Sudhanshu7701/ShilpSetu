import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, MessageSquare, Clock, Loader2 } from "lucide-react";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "",
    icon: MessageSquare,
    description: "Get started with basic access",
    features: [
      "3 messages per order",
      "Browse all products",
      "Order tracking",
    ],
    limits: [
      "No video calls",
      "No priority support",
    ],
    color: "border-muted",
    badge: null,
  },
  {
    id: "normal",
    name: "Plus",
    price: 250,
    period: "/month",
    icon: Zap,
    description: "For regular craft enthusiasts",
    features: [
      "20 messages per order",
      "Message limit: 200 characters",
      "10 minute video calls",
      "Wishlist & reviews",
    ],
    limits: [],
    color: "border-primary",
    badge: "Most Popular",
  },
  {
    id: "premium",
    name: "Pro",
    price: 400,
    period: "/month",
    icon: Crown,
    description: "Unlimited access & exclusive perks",
    features: [
      "Unlimited messages",
      "Unlimited video calls",
      "Priority support",
      "Early access to new collections",
      "Exclusive artisan previews",
    ],
    limits: [],
    color: "border-secondary",
    badge: "Best Value",
  },
];

const SubscriptionPlans = () => {
  const { user } = useAuth();
  const { tier, refreshSubscription } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Handle payment success redirect
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      refreshSubscription();
      toast({ title: "Payment successful! 🎉", description: "Your subscription is now active." });
      // Clean URL
      window.history.replaceState({}, "", "/plans");
    } else if (payment === "cancelled") {
      toast({ variant: "destructive", title: "Payment cancelled" });
      window.history.replaceState({}, "", "/plans");
    }
  }, [searchParams]);

  const handleSelectPlan = async (planId: string) => {
    if (!user) { navigate("/auth"); return; }
    if (planId === "free") return;

    setLoadingPlan(planId);
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription-checkout", {
        body: { plan_id: planId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        toast({ title: "Redirecting to payment…", description: "A new tab has been opened for checkout." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setLoadingPlan(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl font-bold text-foreground mb-3">Communication Plans</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Talk directly with artisans, watch them craft your order live, and get the best handmade experience — pick a plan that fits you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => {
              const isCurrent = tier === plan.id;
              const isLoading = loadingPlan === plan.id;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative bg-card rounded-xl border-2 ${isCurrent ? "border-secondary ring-2 ring-secondary/20" : plan.color} p-6 flex flex-col`}
                >
                  {plan.badge && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3">
                      {plan.badge}
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge className="absolute -top-3 right-4 bg-secondary text-secondary-foreground text-xs px-3">
                      Current Plan
                    </Badge>
                  )}
                  <div className="text-center mb-6">
                    <plan.icon className="h-10 w-10 mx-auto mb-3 text-primary" />
                    <h2 className="font-display text-2xl font-bold text-foreground">{plan.name}</h2>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-foreground">
                        {plan.price === 0 ? "Free" : `₹${plan.price}`}
                      </span>
                      {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </div>

                  <div className="flex-1 space-y-3 mb-6">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-secondary shrink-0" />
                        <span className="text-foreground">{f}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrent || isLoading}
                    className={isCurrent
                      ? "bg-muted text-muted-foreground cursor-default"
                      : plan.id === "premium"
                        ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }
                  >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {isCurrent ? "Current Plan" : plan.price === 0 ? "Downgrade" : "Upgrade Now"}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex flex-wrap justify-center items-center gap-6 bg-card border border-border rounded-lg p-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>Free: 3 msgs/order</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Plus: 20 msgs/order · 200 char limit</span>
              </div>
              <div className="flex items-center gap-2 text-secondary">
                <Crown className="h-4 w-4" />
                <span>Pro: Unlimited</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SubscriptionPlans;
