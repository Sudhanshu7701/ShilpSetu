import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star, Loader2 } from "lucide-react";

interface ReviewSectionProps {
  productId: string;
}

const fetchReviewsData = async (productId: string, userId?: string) => {
  const { data } = await supabase
    .from("reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false });

  if (!data) return { reviews: [], canReview: false, hasReviewed: false };

  // Parallel: fetch profiles + check canReview
  const userIds = [...new Set(data.map((r) => r.user_id))];
  const [profilesRes, canReviewRes] = await Promise.all([
    userIds.length > 0
      ? supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds)
      : Promise.resolve({ data: [] }),
    userId
      ? supabase.from("orders").select("id").eq("customer_id", userId).eq("product_id", productId).eq("status", "delivered").limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const profileMap = new Map((profilesRes.data || []).map((p) => [p.user_id, p]));
  const reviews = data.map((r) => ({ ...r, profile: profileMap.get(r.user_id) }));

  return {
    reviews,
    canReview: !!canReviewRes.data,
    hasReviewed: userId ? data.some((r) => r.user_id === userId) : false,
  };
};

const ReviewSection = ({ productId }: ReviewSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", productId, user?.id],
    queryFn: () => fetchReviewsData(productId, user?.id),
    staleTime: 60_000,
  });

  const reviews = data?.reviews || [];
  const canReview = data?.canReview || false;
  const hasReviewed = data?.hasReviewed || false;

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    setSubmitting(true);

    const { data: order } = await supabase
      .from("orders").select("id").eq("customer_id", user.id).eq("product_id", productId)
      .eq("status", "delivered").limit(1).single();

    if (!order) {
      toast({ variant: "destructive", title: "No delivered order found" });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      user_id: user.id, product_id: productId, order_id: order.id,
      rating, comment: comment.trim() || null,
    });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Review submitted! ⭐" });
      setRating(0);
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0";

  return (
    <div className="mt-10">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="font-display text-xl font-semibold text-foreground">Reviews</h3>
        <span className="text-sm text-muted-foreground">({reviews.length}) · Avg {avgRating} ⭐</span>
      </div>

      {user && canReview && !hasReviewed && (
        <div className="bg-card rounded-lg border border-border p-5 mb-6">
          <p className="text-sm font-medium text-foreground mb-3">Write a Review</p>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" onClick={() => setRating(s)}
                onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}>
                <Star className={`h-6 w-6 transition-colors ${s <= (hoverRating || rating) ? "fill-secondary text-secondary" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea placeholder="Share your experience..." value={comment} onChange={(e) => setComment(e.target.value)} className="mb-3" />
          <Button onClick={handleSubmit} disabled={rating === 0 || submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Submit Review
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 bg-card rounded-lg border border-border">
          <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground overflow-hidden">
                  {r.profile?.avatar_url ? <img src={r.profile.avatar_url} alt="" className="w-full h-full object-cover" /> : r.profile?.full_name?.[0] || "U"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{r.profile?.full_name || "Customer"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? "fill-secondary text-secondary" : "text-muted"}`} />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
