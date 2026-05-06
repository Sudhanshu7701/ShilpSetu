import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ProductCard from "@/components/ProductCard";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import productSaree from "@/assets/product-saree.jpg";

interface RecommendedProduct {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  images: string[] | null;
  region: string | null;
  rating: number | null;
  reviews_count: number | null;
  quantity: number | null;
  is_live: boolean | null;
  rarity_tier: string | null;
  artisan_name: string;
  artisan_verified: boolean;
  match_reason: string;
}

const AIRecommendations = ({ browsingContext }: { browsingContext?: string }) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-product-match", {
        body: { user_id: user?.id || null, browsing_context: browsingContext },
      });
      if (fnError) throw fnError;
      if (data?.recommendations) setRecommendations(data.recommendations);
    } catch (e: any) {
      setError(e.message || "Failed to get recommendations");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user?.id]);

  if (error && recommendations.length === 0) return null;
  if (!loading && recommendations.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold text-foreground">
            AI-Curated For You
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchRecommendations}
          disabled={loading}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 bg-card rounded-lg border border-border">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Finding your perfect matches…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.slice(0, 6).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="relative">
                {p.match_reason && (
                  <div className="absolute -top-2 left-3 z-10 bg-primary/90 text-primary-foreground text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                    ✨ {p.match_reason.slice(0, 40)}
                  </div>
                )}
                <ProductCard
                  id={p.id}
                  image={p.images?.[0] || productSaree}
                  title={p.title}
                  artisan={p.artisan_name}
                  region={p.region || "India"}
                  price={p.price}
                  originalPrice={p.original_price || undefined}
                  rating={p.rating || 0}
                  reviews={p.reviews_count || 0}
                  remaining={p.quantity || undefined}
                  isLive={p.is_live || false}
                  isVerified={p.artisan_verified}
                  rarityTier={(p.rarity_tier as "common" | "rare" | "ultra_rare") || "common"}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
};

export default AIRecommendations;
