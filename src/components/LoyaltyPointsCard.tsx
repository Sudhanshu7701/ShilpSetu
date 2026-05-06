import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Crown, Star, Gift, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LoyaltyTransaction {
  id: string;
  points: number;
  type: string;
  description: string | null;
  created_at: string;
}

const tierThresholds = [
  { name: "Bronze", min: 0, icon: Star, color: "text-amber-700" },
  { name: "Silver", min: 500, icon: Star, color: "text-gray-400" },
  { name: "Gold", min: 2000, icon: Crown, color: "text-yellow-500" },
  { name: "Platinum", min: 5000, icon: Crown, color: "text-purple-400" },
];

const getCurrentTier = (lifetime: number) => {
  return [...tierThresholds].reverse().find((t) => lifetime >= t.min) || tierThresholds[0];
};

const getNextTier = (lifetime: number) => {
  return tierThresholds.find((t) => t.min > lifetime);
};

const LoyaltyPointsCard = () => {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchPoints();
    fetchTransactions();
  }, [user]);

  const fetchPoints = async () => {
    const { data } = await supabase
      .from("loyalty_points" as any)
      .select("points, lifetime_points")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (data) {
      setPoints((data as any).points || 0);
      setLifetimePoints((data as any).lifetime_points || 0);
    }
  };

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from("loyalty_transactions" as any)
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5);
    if (data) setTransactions(data as any);
  };

  const tier = getCurrentTier(lifetimePoints);
  const nextTier = getNextTier(lifetimePoints);
  const TierIcon = tier.icon;
  const progress = nextTier ? ((lifetimePoints - tier.min) / (nextTier.min - tier.min)) * 100 : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold text-foreground">Loyalty Points</h3>
        </div>
        <Badge variant="secondary" className="gap-1">
          <TierIcon className={`h-3 w-3 ${tier.color}`} />
          {tier.name}
        </Badge>
      </div>

      <div className="text-center mb-4">
        <p className="text-3xl font-display font-bold text-primary">{points.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">Available Points</p>
      </div>

      {nextTier && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{tier.name}</span>
            <span>{nextTier.name} ({nextTier.min - lifetimePoints} pts away)</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recent Activity</p>
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between text-xs">
              <span className="text-foreground truncate max-w-[200px]">{t.description}</span>
              <span className={`font-medium ${t.type === "earn" ? "text-green-600" : "text-destructive"}`}>
                {t.type === "earn" ? "+" : "-"}{t.points}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default LoyaltyPointsCard;
