import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ShoppingBag,
  Heart,
  Users,
  Clock,
  Package,
  ChevronRight,
  Star,
  MapPin,
  ShieldCheck,
  Edit,
  Upload,
  Save,
  Loader2,
  Video,
  Image,
  MessageSquare,
  Phone,
  PhoneOff,
  Send,
  Camera,
  Crown,
  Timer,
  RotateCcw,
  AlertTriangle,
  X,
} from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import LoyaltyPointsCard from "@/components/LoyaltyPointsCard";

import productSaree from "@/assets/product-saree.jpg";

interface Order {
  id: string;
  status: string;
  total_amount: number;
  quantity: number | null;
  created_at: string;
  product_id: string;
  artisan_id: string;
  stage_images?: Record<string, string> | null;
  products?: { title: string; images: string[] | null; region: string | null; price: number; description: string | null; category: string | null };
  artisan_profile?: { full_name: string; avatar_url: string | null };
}

interface WishlistItem {
  id: string;
  product_id: string;
  products?: { title: string; images: string[] | null; price: number; region: string | null; rating: number | null; reviews_count: number | null };
}

const stageOrder = ["placed", "design", "weaving", "finishing", "quality_check", "dispatch", "delivered"];
const stageLabels: Record<string, string> = {
  placed: "Placed",
  design: "Design",
  weaving: "Weaving",
  finishing: "Finishing",
  quality_check: "QC",
  dispatch: "Dispatch",
  delivered: "Delivered",
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const CALL_DURATION_LIMITS: Record<string, number> = { free: 180, normal: 900, premium: Infinity };

const CustomerDashboard = () => {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { tier } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [follows, setFollows] = useState<any[]>([]);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", bio: "", region: "" });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());
  const [reviewOpen, setReviewOpen] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [pendingCallRequests, setPendingCallRequests] = useState<Set<string>>(new Set());
  const [acceptedCallUrls, setAcceptedCallUrls] = useState<Map<string, string>>(new Map());
  const [usedCallOrders, setUsedCallOrders] = useState<Set<string>>(new Set());
  const [allowContact, setAllowContact] = useState(false);
  const [activeCallWindows, setActiveCallWindows] = useState<Map<string, Window>>(new Map());
  const [callTimers, setCallTimers] = useState<Map<string, number>>(new Map());
  const callTimerIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Return request state
  const [returnOpen, setReturnOpen] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnEvidence, setReturnEvidence] = useState<string[]>([]);
  const [returnUploading, setReturnUploading] = useState(false);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnAcceptedTnC, setReturnAcceptedTnC] = useState(false);
  const [existingReturns, setExistingReturns] = useState<Set<string>>(new Set());

  const callDurationLimit = CALL_DURATION_LIMITS[tier] || 180;

  // Poll active call windows to detect when closed + enforce timer
  useEffect(() => {
    if (activeCallWindows.size === 0) return;
    const interval = setInterval(() => {
      activeCallWindows.forEach((win, orderId) => {
        if (win.closed) {
          supabase.from("video_call_requests").update({ status: "ended" } as any)
            .eq("order_id", orderId).eq("customer_id", user?.id).eq("status", "accepted").then(() => {});
          setAcceptedCallUrls((prev) => { const n = new Map(prev); n.delete(orderId); return n; });
          setActiveCallWindows((prev) => { const n = new Map(prev); n.delete(orderId); return n; });
          // Clean up timer
          const timerInterval = callTimerIntervalsRef.current.get(orderId);
          if (timerInterval) { clearInterval(timerInterval); callTimerIntervalsRef.current.delete(orderId); }
          setCallTimers((prev) => { const n = new Map(prev); n.delete(orderId); return n; });
        }
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [activeCallWindows, user]);

  const openCallWindow = (orderId: string, url: string) => {
    const win = window.open(url, "_blank");
    if (win) {
      setActiveCallWindows((prev) => new Map(prev).set(orderId, win));
      // Start call timer
      setCallTimers((prev) => new Map(prev).set(orderId, 0));
      const timerInterval = setInterval(() => {
        setCallTimers((prev) => {
          const current = (prev.get(orderId) || 0) + 1;
          const updated = new Map(prev).set(orderId, current);
          // Auto-close if limit reached (non-premium)
          if (current >= callDurationLimit && callDurationLimit !== Infinity) {
            win.close();
          }
          return updated;
        });
      }, 1000);
      callTimerIntervalsRef.current.set(orderId, timerInterval);
    }
  };

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Init profile form
  useEffect(() => {
    if (profile) {
      setProfileForm({ full_name: profile.full_name || "", bio: profile.bio || "", region: profile.region || "" });
      setAvatarUrl(profile.avatar_url);
      setAllowContact(profile.allow_contact ?? false);
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchWishlist();
      fetchFollows();
      fetchReviewedOrders();
      fetchPendingCalls();
      fetchExistingReturns();

      // Real-time order status updates
      const orderChannel = supabase
        .channel('order-updates')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`,
        }, (payload) => {
          const updated = payload.new as any;
          const parsedImages = typeof updated.stage_images === 'string' ? JSON.parse(updated.stage_images) : (updated.stage_images || {});
          setOrders((prev) => prev.map((o) => o.id === updated.id ? { ...o, status: updated.status, stage_images: parsedImages } : o));
          const label = stageLabels[updated.status] || updated.status;
          toast({ title: `Order Updated! 🎉`, description: `Your order status changed to: ${label}` });
        })
        .subscribe();

      // Real-time video call response listener
      const callChannel = supabase
        .channel('call-responses')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_call_requests',
          filter: `customer_id=eq.${user.id}`,
        }, (payload) => {
          const updated = payload.new as any;
          if (updated.status === 'accepted') {
            toast({ title: "Call Accepted! 📞", description: "The artisan accepted your video call. Joining now..." });
            setAcceptedCallUrls((prev) => new Map(prev).set(updated.order_id, updated.room_url));
            setPendingCallRequests((prev) => { const n = new Set(prev); n.delete(updated.order_id); return n; });
            // Open call window and track it
            const win = window.open(updated.room_url, "_blank");
            if (win) {
              setActiveCallWindows((prev) => new Map(prev).set(updated.order_id, win));
            }
          } else if (updated.status === 'declined') {
            toast({ variant: "destructive", title: "Call Declined", description: "The artisan is not available right now." });
            setPendingCallRequests((prev) => { const n = new Set(prev); n.delete(updated.order_id); return n; });
          } else if (updated.status === 'ended') {
            // Artisan ended the call
            setAcceptedCallUrls((prev) => { const n = new Map(prev); n.delete(updated.order_id); return n; });
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(orderChannel); supabase.removeChannel(callChannel); };
    }
  }, [user]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, products(title, images, region, price, description, category)")
      .eq("customer_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) {
      const ordersWithParsed = data.map((o: any) => ({
        ...o,
        stage_images: typeof o.stage_images === 'string' ? JSON.parse(o.stage_images) : (o.stage_images || {}),
      }));
      // Fetch artisan profiles
      const artisanIds = [...new Set(ordersWithParsed.map((o: any) => o.artisan_id))];
      if (artisanIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", artisanIds);
        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
        setOrders(ordersWithParsed.map((o: any) => ({ ...o, artisan_profile: profileMap.get(o.artisan_id) })) as Order[]);
      } else {
        setOrders(ordersWithParsed as Order[]);
      }
    }
  };

  const fetchWishlist = async () => {
    const { data } = await supabase
      .from("wishlists")
      .select("*, products(title, images, price, region, rating, reviews_count)")
      .eq("user_id", user!.id);
    if (data) setWishlist(data as any);
  };

  const fetchFollows = async () => {
    const { data: followData } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", user!.id);
    if (!followData || followData.length === 0) return;
    
    const artisanIds = followData.map((f) => f.artisan_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, region, avatar_url, is_verified")
      .in("user_id", artisanIds);
    
    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
    setFollows(followData.map((f) => ({ ...f, profiles: profileMap.get(f.artisan_id) })));
  };

  const fetchReviewedOrders = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("order_id")
      .eq("user_id", user!.id);
    if (data) setReviewedOrders(new Set(data.map((r) => r.order_id)));
  };

  const fetchPendingCalls = async () => {
    const { data } = await supabase
      .from("video_call_requests")
      .select("order_id, status, room_url")
      .eq("customer_id", user!.id)
      .in("status", ["pending", "accepted"]);
    if (data) {
      const pending = new Set<string>();
      const accepted = new Map<string, string>();
      data.forEach((r: any) => {
        if (r.status === "pending") pending.add(r.order_id);
        if (r.status === "accepted" && r.room_url) accepted.set(r.order_id, r.room_url);
      });
      setPendingCallRequests(pending);
      setAcceptedCallUrls(accepted);
    }

    // Fetch ended/declined calls to track used calls per order (for free tier limit)
    const { data: endedData } = await supabase
      .from("video_call_requests")
      .select("order_id")
      .eq("customer_id", user!.id)
      .in("status", ["ended", "declined"]);
    if (endedData) {
      setUsedCallOrders(new Set(endedData.map((r: any) => r.order_id)));
    }
  };

  const requestVideoCall = async (order: Order) => {
    // Free tier: only 1 call per order
    if (tier === "free" && usedCallOrders.has(order.id)) {
      toast({ variant: "destructive", title: "Call limit reached", description: "Free plan allows only one 3-minute call per order. Upgrade for more!" });
      return;
    }
    const roomUrl = `https://meet.jit.si/kalakriti-order-${order.id.slice(0, 8)}`;
    const { error } = await supabase.from("video_call_requests").insert({
      order_id: order.id,
      customer_id: user!.id,
      artisan_id: order.artisan_id,
      room_url: roomUrl,
    } as any);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setPendingCallRequests((prev) => new Set(prev).add(order.id));
      toast({ title: "Call Request Sent! 📞", description: "Waiting for the artisan to accept..." });
    }
  };

  const submitReview = async (orderId: string, productId: string) => {
    if (!user || reviewRating === 0) return;
    setSubmittingReview(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id, product_id: productId, order_id: orderId,
      rating: reviewRating, comment: reviewComment.trim() || null,
    });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Review submitted! ⭐" });
      setReviewedOrders((prev) => new Set(prev).add(orderId));
      setReviewOpen(null);
      setReviewRating(0);
      setReviewComment("");
    }
    setSubmittingReview(false);
  };
  const removeWishlistItem = async (id: string) => {
    await supabase.from("wishlists").delete().eq("id", id);
    setWishlist((prev) => prev.filter((w) => w.id !== id));
  };

  const fetchExistingReturns = async () => {
    const { data } = await supabase
      .from("return_requests")
      .select("order_id")
      .eq("customer_id", user!.id);
    if (data) setExistingReturns(new Set(data.map((r: any) => r.order_id)));
  };

  const handleReturnEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    setReturnUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("return-evidence").upload(path, file);
      if (error) {
        toast({ variant: "destructive", title: "Upload failed", description: error.message });
        continue;
      }
      const { data } = supabase.storage.from("return-evidence").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    setReturnEvidence((prev) => [...prev, ...urls]);
    setReturnUploading(false);
  };

  const submitReturnRequest = async (orderId: string) => {
    if (!user || !returnReason.trim() || returnEvidence.length === 0 || !returnAcceptedTnC) return;
    setReturnSubmitting(true);
    const { error } = await supabase.from("return_requests").insert({
      order_id: orderId,
      customer_id: user.id,
      reason: returnReason.trim(),
      evidence_urls: returnEvidence,
    } as any);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Return request submitted! 📦", description: "We'll review your request and get back to you." });
      setExistingReturns((prev) => new Set(prev).add(orderId));
      setReturnOpen(null);
      setReturnReason("");
      setReturnEvidence([]);
      setReturnAcceptedTnC(false);
    }
    setReturnSubmitting(false);
  };

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" as any })
      .eq("id", orderId)
      .eq("customer_id", user!.id);
    if (error) {
      toast({ variant: "destructive", title: "Cannot cancel", description: "Cancellation window may have expired." });
    } else {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "cancelled" } : o));
      toast({ title: "Order cancelled" });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profileForm.full_name,
      bio: profileForm.bio || null,
      region: profileForm.region || null,
      avatar_url: avatarUrl,
      allow_contact: allowContact,
    } as any).eq("user_id", user.id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Profile updated! ✨" });
      setEditProfileOpen(false);
      await refreshProfile();
    }
    setSavingProfile(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) { toast({ variant: "destructive", title: "Upload failed", description: error.message }); return; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
  };

  const canCancel = (order: Order) => {
    if (order.status !== "placed") return false;
    const placed = new Date(order.created_at).getTime();
    const now = Date.now();
    return now - placed < 24 * 60 * 60 * 1000;
  };

  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">My Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back, {profile?.full_name || "there"}</p>
            </div>
            <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-4 sm:mt-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <Edit className="h-4 w-4 mr-1" /> Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader><DialogTitle className="font-display">Edit Profile</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-muted overflow-hidden shrink-0">
                      {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> :
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground font-display font-bold text-xl">{profileForm.full_name[0] || "U"}</div>}
                    </div>
                    <div>
                      <Label htmlFor="avatar-customer" className="cursor-pointer inline-flex items-center gap-1 text-sm text-primary hover:underline"><Upload className="h-3.5 w-3.5" /> Upload photo</Label>
                      <input id="avatar-customer" type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </div>
                  </div>
                  <div><Label>Full Name</Label><Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} className="mt-1" /></div>
                  <div><Label>Bio</Label><Textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} placeholder="Tell us about yourself..." className="mt-1" /></div>
                  <div><Label>Region</Label><Input value={profileForm.region} onChange={(e) => setProfileForm({ ...profileForm, region: e.target.value })} placeholder="e.g. Mumbai, MH" className="mt-1" /></div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Allow artisan contact</p>
                      <p className="text-xs text-muted-foreground">Let artisans chat or video call you about your orders</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAllowContact(!allowContact)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${allowContact ? "bg-secondary" : "bg-muted"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${allowContact ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                  <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Save Profile
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { icon: ShoppingBag, label: "Total Orders", value: orders.length, color: "text-primary" },
              { icon: Clock, label: "In Progress", value: activeOrders.length, color: "text-secondary" },
              { icon: Heart, label: "Wishlist", value: wishlist.length, color: "text-primary" },
              { icon: Users, label: "Following", value: follows.length, color: "text-secondary" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-lg p-5 border border-border shadow-card"
              >
                <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Loyalty Points */}
          <div className="mb-6">
            <LoyaltyPointsCard />
          </div>

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="bg-muted">
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-lg border border-border">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-display text-lg text-foreground">No orders yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Start exploring handcrafted treasures!</p>
                  <Button className="mt-4 bg-primary text-primary-foreground" asChild>
                    <a href="/shop">Browse Shop</a>
                  </Button>
                </div>
              ) : (
                orders.map((order) => {
                  const currentIndex = stageOrder.indexOf(order.status);
                  const stageImages = order.stage_images || {};
                  const hasStageImages = Object.keys(stageImages).length > 0;
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card rounded-lg border border-border p-5"
                    >
                      {/* Header with product info */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={order.products?.images?.[0] || productSaree}
                            alt={order.products?.title || "Product"}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div>
                            <h3 className="font-display font-semibold text-foreground text-sm line-clamp-1">
                              {order.products?.title || "Product"}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              {order.quantity && ` · Qty: ${order.quantity}`}
                            </p>
                            <p className="text-sm font-bold text-foreground mt-1">{formatINR(order.total_amount)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {canCancel(order) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs"
                              onClick={() => cancelOrder(order.id)}
                            >
                              Cancel Order
                            </Button>
                          )}
                          <Badge
                            className={
                              order.status === "delivered"
                                ? "bg-secondary/20 text-secondary border-0"
                                : order.status === "cancelled"
                                ? "bg-destructive/20 text-destructive border-0"
                                : "bg-primary/10 text-primary border-0"
                            }
                          >
                            {stageLabels[order.status] || order.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="bg-muted/50 rounded-lg p-3 mb-4 text-xs space-y-1">
                        {order.products?.description && (
                          <p className="text-muted-foreground line-clamp-2">{order.products.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-muted-foreground">
                          {order.products?.category && <span>Category: <span className="text-foreground font-medium">{order.products.category}</span></span>}
                          {order.products?.region && <span>Region: <span className="text-foreground font-medium">{order.products.region}</span></span>}
                          {order.products?.price && <span>Unit Price: <span className="text-foreground font-medium">{formatINR(order.products.price)}</span></span>}
                        </div>
                        {order.artisan_profile && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <div className="w-5 h-5 rounded-full bg-muted overflow-hidden">
                              {order.artisan_profile.avatar_url ? (
                                <img src={order.artisan_profile.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-muted-foreground">{order.artisan_profile.full_name[0]}</div>
                              )}
                            </div>
                            <span className="text-muted-foreground">Artisan: <span className="text-foreground font-medium">{order.artisan_profile.full_name}</span></span>
                          </div>
                        )}
                      </div>

                      {/* Video Call & Chat Buttons */}
                      {!["delivered", "cancelled"].includes(order.status) && (
                        <div className="flex flex-wrap gap-2 mb-3 items-center">
                          {acceptedCallUrls.has(order.id) ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs"
                                onClick={() => openCallWindow(order.id, acceptedCallUrls.get(order.id)!)}
                              >
                                <Video className="h-3.5 w-3.5 mr-1" /> Join Call
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs"
                                onClick={async () => {
                                  await supabase.from("video_call_requests").update({ status: "ended" } as any)
                                    .eq("order_id", order.id).eq("customer_id", user!.id).eq("status", "accepted");
                                  setAcceptedCallUrls((prev) => { const n = new Map(prev); n.delete(order.id); return n; });
                                  // Close window if open
                                  const win = activeCallWindows.get(order.id);
                                  if (win && !win.closed) win.close();
                                  setActiveCallWindows((prev) => { const n = new Map(prev); n.delete(order.id); return n; });
                                  const timerInterval = callTimerIntervalsRef.current.get(order.id);
                                  if (timerInterval) { clearInterval(timerInterval); callTimerIntervalsRef.current.delete(order.id); }
                                  setCallTimers((prev) => { const n = new Map(prev); n.delete(order.id); return n; });
                                  toast({ title: "Call ended" });
                                }}
                              >
                                <PhoneOff className="h-3.5 w-3.5" />
                              </Button>
                              {callTimers.has(order.id) && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  {Math.floor((callTimers.get(order.id) || 0) / 60)}:{String((callTimers.get(order.id) || 0) % 60).padStart(2, "0")}
                                  {callDurationLimit !== Infinity && (
                                    <span className="text-primary">/ {Math.floor(callDurationLimit / 60)}:{String(callDurationLimit % 60).padStart(2, "0")}</span>
                                  )}
                                </span>
                              )}
                            </div>
                          ) : pendingCallRequests.has(order.id) ? (
                            <Button size="sm" variant="outline" disabled className="text-xs border-muted-foreground text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 mr-1 animate-pulse" /> Waiting for Artisan…
                            </Button>
                          ) : tier === "free" && usedCallOrders.has(order.id) ? (
                            <>
                              <Button size="sm" variant="outline" disabled className="text-xs border-muted text-muted-foreground">
                                <Video className="h-3.5 w-3.5 mr-1" /> Call Used
                              </Button>
                              <a href="/plans" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                                <Crown className="h-3 w-3" /> Upgrade for more calls
                              </a>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs"
                                onClick={() => requestVideoCall(order)}
                              >
                                <Video className="h-3.5 w-3.5 mr-1" /> Video Call Artisan
                              </Button>
                              {tier === "free" && (
                                <a href="/plans" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                                  <Crown className="h-3 w-3" /> Upgrade for longer calls
                                </a>
                              )}
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs"
                            onClick={() => {
                              const startChat = async () => {
                                const { data: existing } = await supabase
                                  .from("messages")
                                  .select("id")
                                  .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${order.artisan_id}),and(sender_id.eq.${order.artisan_id},receiver_id.eq.${user!.id})`)
                                  .limit(1);
                                if (!existing || existing.length === 0) {
                                  await supabase.from("messages").insert({
                                    sender_id: user!.id,
                                    receiver_id: order.artisan_id,
                                    content: `Hi! I have a question about my order for "${order.products?.title || 'a product'}".`,
                                  });
                                }
                                navigate("/messages");
                              };
                              startChat();
                            }}
                          >
                            <Send className="h-3.5 w-3.5 mr-1" /> Chat with Artisan
                          </Button>
                        </div>
                      )}

                      {/* Production Tracker */}
                      {!["cancelled"].includes(order.status) && (
                        <div className="flex items-center gap-1">
                          {stageOrder.map((stage, i) => {
                            const done = i <= currentIndex;
                            const active = i === currentIndex;
                            return (
                              <div key={stage} className="flex items-center flex-1">
                                <div
                                  className={`relative group/stage w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                                    done
                                      ? "bg-secondary text-secondary-foreground"
                                      : "bg-muted text-muted-foreground"
                                  } ${active ? "ring-2 ring-secondary/30" : ""}`}
                                >
                                  {done ? "✓" : i + 1}
                                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground whitespace-nowrap opacity-0 group-hover/stage:opacity-100 transition-opacity">
                                    {stageLabels[stage]}
                                  </span>
                                </div>
                                {i < stageOrder.length - 1 && (
                                  <div className={`h-0.5 flex-1 mx-1 rounded ${done ? "bg-secondary" : "bg-muted"}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Stage Images - artisan-style layout */}
                      {!["cancelled"].includes(order.status) && (
                        <>
                          <div className="flex flex-wrap gap-2 mt-4 mb-3">
                            {/* Previously completed stages with images */}
                            {stageOrder.filter((stage, i) => i < currentIndex && stageImages[stage]).map((stage) => (
                              <div key={stage} className="relative">
                                <a href={stageImages[stage]} target="_blank" rel="noopener noreferrer">
                                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-primary/30 transition-all">
                                    <img src={stageImages[stage]} alt={stageLabels[stage]} className="w-full h-full object-cover" />
                                  </div>
                                </a>
                                <p className="text-[8px] text-muted-foreground text-center mt-0.5">{stageLabels[stage]}</p>
                              </div>
                            ))}
                            {/* Current stage image */}
                            {(() => {
                              const currentStage = stageOrder[currentIndex];
                              const stageImg = stageImages[currentStage];
                              return stageImg ? (
                                <div className="relative">
                                  <a href={stageImg} target="_blank" rel="noopener noreferrer">
                                    <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-primary">
                                      <img src={stageImg} alt={stageLabels[currentStage]} className="w-full h-full object-cover" />
                                    </div>
                                  </a>
                                  <p className="text-[8px] text-primary text-center mt-0.5 font-medium">{stageLabels[currentStage]}</p>
                                </div>
                              ) : (
                                <div className="relative">
                                  <div className="w-14 h-14 rounded-lg border-2 border-dashed border-primary/50 flex flex-col items-center justify-center text-primary/70">
                                    <Camera className="h-3.5 w-3.5" />
                                  </div>
                                  <p className="text-[8px] text-primary/70 text-center mt-0.5">{stageLabels[currentStage]}</p>
                                </div>
                              );
                            })()}
                          </div>
                        </>
                      )}

                      {/* Review for delivered orders */}
                      {order.status === "delivered" && !reviewedOrders.has(order.id) && (
                        <div className="mt-4">
                          {reviewOpen === order.id ? (
                            <div className="bg-muted/50 rounded-lg border border-border p-4">
                              <p className="text-sm font-medium text-foreground mb-3">Write a Review</p>
                              <div className="flex gap-1 mb-3">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <button key={s} type="button" onClick={() => setReviewRating(s)}
                                    onMouseEnter={() => setReviewHover(s)} onMouseLeave={() => setReviewHover(0)}>
                                    <Star className={`h-6 w-6 transition-colors ${s <= (reviewHover || reviewRating) ? "fill-secondary text-secondary" : "text-muted-foreground"}`} />
                                  </button>
                                ))}
                              </div>
                              <Textarea placeholder="Share your experience with this craft..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className="mb-3" />
                              <div className="flex gap-2">
                                <Button onClick={() => submitReview(order.id, order.product_id)} disabled={reviewRating === 0 || submittingReview} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                  {submittingReview && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                                  Submit Review
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => { setReviewOpen(null); setReviewRating(0); setReviewComment(""); }}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button variant="outline" size="sm" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground text-xs"
                              onClick={() => { setReviewOpen(order.id); setReviewRating(0); setReviewComment(""); }}>
                              <MessageSquare className="h-3.5 w-3.5 mr-1" /> Write a Review
                            </Button>
                          )}
                        </div>
                      )}
                      {order.status === "delivered" && reviewedOrders.has(order.id) && (
                        <p className="mt-3 text-xs text-secondary flex items-center gap-1"><Star className="h-3 w-3 fill-secondary" /> You've reviewed this product</p>
                      )}

                      {/* Return Request for delivered orders */}
                      {order.status === "delivered" && !existingReturns.has(order.id) && (
                        <div className="mt-4">
                          {returnOpen === order.id ? (
                            <div className="bg-muted/50 rounded-lg border border-border p-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                  <RotateCcw className="h-4 w-4" /> Request Return
                                </p>
                                <button onClick={() => { setReturnOpen(null); setReturnReason(""); setReturnEvidence([]); setReturnAcceptedTnC(false); }}>
                                  <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                              </div>

                              {/* Terms & Conditions */}
                              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-xs space-y-1.5">
                                <p className="font-semibold text-destructive flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Return Policy – Terms & Conditions</p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                                  <li>Returns are <strong className="text-foreground">only accepted for quality issues</strong> such as torn, cut, damaged, or defective items.</li>
                                  <li>You must upload <strong className="text-foreground">photo or video evidence</strong> clearly showing the defect.</li>
                                  <li>Returns for change of mind, wrong size preference, or color variation are <strong className="text-foreground">not eligible</strong>.</li>
                                  <li>Return requests must be raised within <strong className="text-foreground">7 days of delivery</strong>.</li>
                                  <li>Each return request is reviewed by our team; approval is not guaranteed.</li>
                                </ul>
                              </div>

                              <div className="flex items-start gap-2">
                                <Checkbox
                                  id={`tnc-${order.id}`}
                                  checked={returnAcceptedTnC}
                                  onCheckedChange={(v) => setReturnAcceptedTnC(!!v)}
                                  className="mt-0.5"
                                />
                                <label htmlFor={`tnc-${order.id}`} className="text-xs text-muted-foreground cursor-pointer">
                                  I have read and agree to the return policy. I confirm this is a genuine quality issue.
                                </label>
                              </div>

                              {/* Reason */}
                              <div>
                                <Label className="text-xs">Describe the issue *</Label>
                                <Textarea
                                  placeholder="Please describe the quality issue in detail (e.g., torn fabric, broken part, color bleeding)..."
                                  value={returnReason}
                                  onChange={(e) => setReturnReason(e.target.value)}
                                  className="mt-1 text-sm"
                                  maxLength={500}
                                />
                                <p className="text-[10px] text-muted-foreground mt-0.5">{returnReason.length}/500</p>
                              </div>

                              {/* Evidence Upload */}
                              <div>
                                <Label className="text-xs">Upload evidence (photo/video) *</Label>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {returnEvidence.map((url, i) => (
                                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                                      {url.match(/\.(mp4|mov|webm)$/i) ? (
                                        <video src={url} className="w-full h-full object-cover" />
                                      ) : (
                                        <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                                      )}
                                      <button
                                        onClick={() => setReturnEvidence((prev) => prev.filter((_, j) => j !== i))}
                                        className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                                      >
                                        <X className="h-2.5 w-2.5" />
                                      </button>
                                    </div>
                                  ))}
                                  <label className="w-16 h-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                                    {returnUploading ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    ) : (
                                      <>
                                        <Camera className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-[8px] text-muted-foreground mt-0.5">Add</span>
                                      </>
                                    )}
                                    <input type="file" accept="image/*,video/*" multiple onChange={handleReturnEvidenceUpload} className="hidden" />
                                  </label>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => submitReturnRequest(order.id)}
                                  disabled={!returnAcceptedTnC || !returnReason.trim() || returnEvidence.length === 0 || returnSubmitting}
                                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                  {returnSubmitting && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                                  Submit Return Request
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => { setReturnOpen(null); setReturnReason(""); setReturnEvidence([]); setReturnAcceptedTnC(false); }}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs"
                              onClick={() => { setReturnOpen(order.id); setReturnReason(""); setReturnEvidence([]); setReturnAcceptedTnC(false); }}
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Request Return
                            </Button>
                          )}
                        </div>
                      )}
                      {order.status === "delivered" && existingReturns.has(order.id) && (
                        <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Return request submitted</p>
                      )}
                    </motion.div>
                  );
                })
              )}
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist">
              {wishlist.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-lg border border-border">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-display text-lg text-foreground">Your wishlist is empty</p>
                  <p className="text-sm text-muted-foreground mt-1">Save items you love for later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {wishlist.map((w) => (
                    <div key={w.id} className="relative">
                      <ProductCard
                        id={w.product_id}
                        image={w.products?.images?.[0] || productSaree}
                        title={w.products?.title || "Product"}
                        artisan="Artisan"
                        region={w.products?.region || "India"}
                        price={w.products?.price || 0}
                        rating={w.products?.rating || 0}
                        reviews={w.products?.reviews_count || 0}
                      />
                      <button
                        onClick={() => removeWishlistItem(w.id)}
                        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Following Tab */}
            <TabsContent value="following">
              {follows.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-lg border border-border">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-display text-lg text-foreground">Not following anyone yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Follow artisans to stay updated on their latest crafts.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {follows.map((f) => (
                    <a
                      key={f.id}
                      href={`/artisan/${f.artisan_id}`}
                      className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                        {f.profiles?.avatar_url ? (
                          <img src={f.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-display font-bold">
                            {f.profiles?.full_name?.[0] || "A"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-foreground text-sm truncate">{f.profiles?.full_name}</span>
                          {f.profiles?.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-secondary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {f.profiles?.region || "India"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CustomerDashboard;
