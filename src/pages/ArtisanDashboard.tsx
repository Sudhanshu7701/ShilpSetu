import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { notifyOrderStatusUpdate } from "@/lib/notifications";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Package, ShoppingCart, Clock, TrendingUp, Plus, Edit,
  ChevronRight, Loader2, Save, Upload, Trash2, Camera,
  Video, PhoneOff, Phone, Send, ShieldCheck, BarChart3,
} from "lucide-react";
import ProducerAnalytics from "@/components/ProducerAnalytics";
import BrandSettings from "@/components/BrandSettings";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import ImageUpload from "@/components/ImageUpload";
import VerificationBanner from "@/components/VerificationBanner";
import productSaree from "@/assets/product-saree.jpg";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  original_price: number | null;
  images: string[] | null;
  region: string | null;
  quantity: number;
  rating: number;
  reviews_count: number;
  is_live: boolean;
  category: string | null;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  quantity: number | null;
  created_at: string;
  customer_id: string;
  product_id: string;
  stage_images?: Record<string, string> | null;
  products?: { title: string; images: string[] | null };
  customer_profile?: { full_name: string; allow_contact?: boolean };
}

const stageOrder = ["placed", "design", "weaving", "finishing", "quality_check", "dispatch", "delivered"];
const stageLabels: Record<string, string> = {
  placed: "Placed", design: "Design", weaving: "Weaving", finishing: "Finishing",
  quality_check: "QC", dispatch: "Dispatch", delivered: "Delivered",
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const ArtisanDashboard = () => {
  const { user, profile, role, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ title: "", description: "", price: "", originalPrice: "", region: "", quantity: "1", category: "" });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [profileForm, setProfileForm] = useState({ full_name: "", bio: "", region: "", specialties: "" });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [pendingArtisanCalls, setPendingArtisanCalls] = useState<Set<string>>(new Set());
  const [acceptedArtisanCallUrls, setAcceptedArtisanCallUrls] = useState<Map<string, string>>(new Map());
  const [artisanCallWindows, setArtisanCallWindows] = useState<Map<string, Window>>(new Map());

  // Auth guard: redirect non-artisans
  useEffect(() => {
    if (!authLoading && (!user || role !== "artisan")) {
      navigate(user ? "/" : "/auth", { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  // Poll artisan call windows for close detection
  useEffect(() => {
    if (artisanCallWindows.size === 0) return;
    const interval = setInterval(() => {
      artisanCallWindows.forEach((win, orderId) => {
        if (win.closed) {
          supabase.from("video_call_requests").update({ status: "ended" } as any)
            .eq("order_id", orderId).eq("artisan_id", user?.id).eq("status", "accepted").then(() => {});
          setAcceptedArtisanCallUrls((prev) => { const n = new Map(prev); n.delete(orderId); return n; });
          setArtisanCallWindows((prev) => { const n = new Map(prev); n.delete(orderId); return n; });
        }
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [artisanCallWindows, user]);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchOrders();
      fetchArtisanInitiatedCalls();

      // Periodic refetch to catch stale calls
      const pollInterval = setInterval(fetchArtisanInitiatedCalls, 10000);

      // Listen for responses to artisan-initiated calls
      const artisanCallChannel = supabase
        .channel('artisan-outgoing-calls')
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'video_call_requests',
          filter: `artisan_id=eq.${user.id}`,
        }, (payload) => {
          const updated = payload.new as any;
          // Handle ended status for ALL calls
          if (updated.status === 'ended') {
            setAcceptedArtisanCallUrls((prev) => { const n = new Map(prev); n.delete(updated.order_id); return n; });
            setPendingArtisanCalls((prev) => { const n = new Set(prev); n.delete(updated.order_id); return n; });
            return;
          }
          if (updated.initiated_by !== 'artisan') return;
          if (updated.status === 'accepted') {
            toast({ title: "Call Accepted! 📞", description: "Customer accepted your call. Joining..." });
            setAcceptedArtisanCallUrls((prev) => new Map(prev).set(updated.order_id, updated.room_url));
            setPendingArtisanCalls((prev) => { const n = new Set(prev); n.delete(updated.order_id); return n; });
            const win = window.open(updated.room_url, "_blank");
            if (win) setArtisanCallWindows((prev) => new Map(prev).set(updated.order_id, win));
          } else if (updated.status === 'declined') {
            toast({ variant: "destructive", title: "Call Declined", description: "Customer is not available right now." });
            setPendingArtisanCalls((prev) => { const n = new Set(prev); n.delete(updated.order_id); return n; });
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(artisanCallChannel); clearInterval(pollInterval); };
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "", bio: profile.bio || "",
        region: profile.region || "", specialties: profile.specialties?.join(", ") || "",
      });
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  // Wait for auth to be ready before rendering
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").eq("artisan_id", user!.id).order("created_at", { ascending: false });
    if (data) setProducts(data);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*, products(title, images)").eq("artisan_id", user!.id).order("created_at", { ascending: false });
    if (data) {
      const ordersWithParsedImages = data.map((o: any) => ({
        ...o,
        stage_images: typeof o.stage_images === 'string' ? JSON.parse(o.stage_images) : (o.stage_images || {}),
      }));
      const customerIds = [...new Set(ordersWithParsedImages.map((o: any) => o.customer_id))];
      if (customerIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, allow_contact").in("user_id", customerIds);
        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
        setOrders(ordersWithParsedImages.map((o: any) => ({ ...o, customer_profile: profileMap.get(o.customer_id) })) as Order[]);
      } else {
        setOrders(ordersWithParsedImages as Order[]);
      }
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedImages.length === 0) {
      toast({ variant: "destructive", title: "Image required", description: "Please upload at least one product image before adding." });
      return;
    }
    setSavingProduct(true);
    const { error } = await supabase.from("products").insert({
      artisan_id: user!.id, title: productForm.title, description: productForm.description,
      price: parseFloat(productForm.price),
      original_price: productForm.originalPrice ? parseFloat(productForm.originalPrice) : null,
      region: productForm.region,
      quantity: parseInt(productForm.quantity), category: productForm.category || null,
      images: uploadedImages,
    });
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); }
    else { toast({ title: "Product added!" }); setAddOpen(false); resetProductForm(); fetchProducts(); }
    setSavingProduct(false);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({ title: p.title, description: p.description || "", price: p.price.toString(), originalPrice: p.original_price?.toString() || "", region: p.region || "", quantity: p.quantity.toString(), category: p.category || "" });
    setUploadedImages(p.images || []);
    setEditOpen(true);
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (uploadedImages.length === 0) {
      toast({ variant: "destructive", title: "Image required", description: "Please upload at least one product image." });
      return;
    }
    setSavingProduct(true);
    const { error } = await supabase.from("products").update({
      title: productForm.title, description: productForm.description,
      price: parseFloat(productForm.price),
      original_price: productForm.originalPrice ? parseFloat(productForm.originalPrice) : null,
      region: productForm.region,
      quantity: parseInt(productForm.quantity), category: productForm.category || null,
      images: uploadedImages,
    }).eq("id", editingProduct.id);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); }
    else { toast({ title: "Product updated! ✨" }); setEditOpen(false); setEditingProduct(null); resetProductForm(); fetchProducts(); }
    setSavingProduct(false);
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); }
    else { toast({ title: "Product deleted" }); setProducts((prev) => prev.filter((p) => p.id !== id)); }
  };

  const resetProductForm = () => { setProductForm({ title: "", description: "", price: "", originalPrice: "", region: "", quantity: "1", category: "" }); setUploadedImages([]); };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const specialties = profileForm.specialties.split(",").map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase.from("profiles").update({
      full_name: profileForm.full_name, bio: profileForm.bio || null, region: profileForm.region || null, specialties, avatar_url: avatarUrl,
    }).eq("user_id", user.id);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); }
    else { toast({ title: "Profile updated! ✨" }); setEditProfileOpen(false); await refreshProfile(); }
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

  const handleStageImageUpload = async (orderId: string, stage: string, file: File) => {
    const ext = file.name.split(".").pop();
    const path = `orders/${orderId}/${stage}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) { toast({ variant: "destructive", title: "Upload failed", description: error.message }); return; }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    const imageUrl = urlData.publicUrl;
    
    // Get current stage_images for this order
    const order = orders.find((o) => o.id === orderId);
    const currentImages = order?.stage_images || {};
    const updatedImages = { ...currentImages, [stage]: imageUrl };
    
    const { error: updateError } = await supabase.from("orders").update({ stage_images: updatedImages as any }).eq("id", orderId);
    if (updateError) { toast({ variant: "destructive", title: "Error", description: updateError.message }); return; }
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, stage_images: updatedImages } : o));
    toast({ title: `Photo added for ${stageLabels[stage]} stage 📸` });
  };

  const fetchArtisanInitiatedCalls = async () => {
    const { data } = await supabase
      .from("video_call_requests")
      .select("order_id, status, room_url")
      .eq("artisan_id", user!.id)
      .eq("initiated_by", "artisan")
      .in("status", ["pending", "accepted"]);
    if (data) {
      const pending = new Set<string>();
      const accepted = new Map<string, string>();
      data.forEach((r: any) => {
        if (r.status === "pending") pending.add(r.order_id);
        if (r.status === "accepted" && r.room_url) accepted.set(r.order_id, r.room_url);
      });
      setPendingArtisanCalls(pending);
      setAcceptedArtisanCallUrls(accepted);
    }
  };

  const requestVideoCallToCustomer = async (order: Order) => {
    const roomUrl = `https://meet.jit.si/kalakriti-order-${order.id.slice(0, 8)}`;
    const { error } = await supabase.from("video_call_requests").insert({
      order_id: order.id,
      customer_id: order.customer_id,
      artisan_id: user!.id,
      room_url: roomUrl,
      initiated_by: "artisan",
    } as any);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setPendingArtisanCalls((prev) => new Set(prev).add(order.id));
      toast({ title: "Call Request Sent! 📞", description: "Waiting for customer to accept..." });
    }
  };

  const advanceOrder = async (orderId: string, currentStatus: string) => {
    const currentIndex = stageOrder.indexOf(currentStatus);
    if (currentIndex >= stageOrder.length - 1) return;
    const nextStatus = stageOrder[currentIndex + 1];
    setUpdatingOrder(orderId);
    const { error } = await supabase.from("orders").update({ status: nextStatus as any }).eq("id", orderId);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); }
    else {
      toast({ title: `Order advanced to ${stageLabels[nextStatus]}` });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: nextStatus } : o));
      // Notify customer of status change + send email
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        // Fetch customer email for email notification
        const { data: custAuth } = await supabase.from("profiles").select("full_name").eq("user_id", order.customer_id).single();
        notifyOrderStatusUpdate(
          order.customer_id, order.products?.title || "your order", nextStatus, orderId,
          undefined, // email not available from profiles - email sent via in-app notification
          custAuth?.full_name || "Customer"
        );
      }
    }
    setUpdatingOrder(null);
  };


  const completedOrders = orders.filter((o) => o.status === "delivered").length;
  const pendingOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length;
  const revenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const stats = [
    { icon: ShoppingCart, label: "Orders", value: orders.length.toString(), color: "text-primary" },
    { icon: Package, label: "Completed", value: completedOrders.toString(), color: "text-secondary" },
    { icon: Clock, label: "Pending", value: pendingOrders.toString(), color: "text-muted-foreground" },
    { icon: TrendingUp, label: "Revenue", value: formatINR(revenue), color: "text-secondary" },
  ];

  const renderProductForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div><Label>Title</Label><Input value={productForm.title} onChange={(e) => setProductForm({ ...productForm, title: e.target.value })} required className="mt-1" /></div>
      <div><Label>Description</Label><Textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="mt-1" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Selling Price (₹)</Label><Input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required className="mt-1" /></div>
        <div><Label>Original Price / MRP (₹)</Label><Input type="number" value={productForm.originalPrice} onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })} placeholder="Leave empty if no discount" className="mt-1" /></div>
      </div>
      {productForm.originalPrice && productForm.price && parseFloat(productForm.originalPrice) > parseFloat(productForm.price) && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/10 border border-secondary/20">
          <Badge className="bg-secondary text-secondary-foreground border-0 text-xs">
            {Math.round(((parseFloat(productForm.originalPrice) - parseFloat(productForm.price)) / parseFloat(productForm.originalPrice)) * 100)}% OFF
          </Badge>
          <span className="text-xs text-muted-foreground">Customers will see the discount on this product</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Quantity</Label><Input type="number" value={productForm.quantity} onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })} className="mt-1" /></div>
      </div>
      <div>
        <Label className="flex items-center gap-1">Images <span className="text-destructive">*</span></Label>
        <div className="mt-1"><ImageUpload userId={user!.id} onUpload={setUploadedImages} existingImages={uploadedImages} /></div>
        {uploadedImages.length === 0 && <p className="text-xs text-destructive mt-1">At least one image is required</p>}
      </div>
      <div><Label>Region</Label><Input value={productForm.region} onChange={(e) => setProductForm({ ...productForm, region: e.target.value })} placeholder="e.g. Varanasi, UP" className="mt-1" /></div>
      <div>
        <Label>Category</Label>
        <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">Select category</option>
          {["Sarees", "Pottery", "Paintings", "Shawls", "Textiles", "Metalwork", "Jewellery", "Woodwork", "Himalayan Herbs", "Tribal Weaves"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={savingProduct} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        {savingProduct && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{submitLabel}
      </Button>
    </form>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Artisan Studio</h1>
              <p className="text-muted-foreground mt-1">Welcome back, {profile?.full_name || "Artisan"}</p>
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
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground font-display font-bold text-xl">{profileForm.full_name[0] || "A"}</div>}
                    </div>
                    <div>
                      <Label htmlFor="avatar" className="cursor-pointer inline-flex items-center gap-1 text-sm text-primary hover:underline"><Upload className="h-3.5 w-3.5" /> Upload photo</Label>
                      <input id="avatar" type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </div>
                  </div>
                  <div><Label>Full Name</Label><Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} className="mt-1" /></div>
                  <div><Label>Bio</Label><Textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} placeholder="Tell your story..." className="mt-1" /></div>
                  <div><Label>Region</Label><Input value={profileForm.region} onChange={(e) => setProfileForm({ ...profileForm, region: e.target.value })} placeholder="e.g. Varanasi, UP" className="mt-1" /></div>
                  <div><Label>Specialties</Label><Input value={profileForm.specialties} onChange={(e) => setProfileForm({ ...profileForm, specialties: e.target.value })} placeholder="Silk Weaving, Zari Work (comma-separated)" className="mt-1" /></div>
                  <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Save Profile
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Verification Banner */}
          <VerificationBanner />

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {stats.map((stat) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-lg p-5 border border-border shadow-card">
                <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>


          <Tabs defaultValue="products" className="space-y-6">
            <TabsList className="bg-muted">
              <TabsTrigger value="products">My Products ({products.length})</TabsTrigger>
              <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="h-3.5 w-3.5" /> Analytics</TabsTrigger>
              <TabsTrigger value="brand" className="gap-1">🎨 Brand</TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Add Product — only for verified artisans */}
                {profile?.is_verified ? (
                  <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetProductForm(); }}>
                    <DialogTrigger asChild>
                      <motion.button whileHover={{ y: -4 }} className="bg-card rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center min-h-[320px] text-muted-foreground hover:text-primary">
                        <Plus className="h-10 w-10 mb-2" /><span className="font-medium">Add Product</span>
                      </motion.button>
                    </DialogTrigger>
                    <DialogContent className="bg-card max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle className="font-display">Add New Product</DialogTitle></DialogHeader>
                      {renderProductForm(handleAddProduct, "Add Product")}
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="bg-card rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center min-h-[320px] text-muted-foreground p-6 text-center">
                    <ShieldCheck className="h-10 w-10 mb-3 text-muted-foreground/50" />
                    <span className="font-medium text-sm">Verify Identity First</span>
                    <span className="text-xs mt-1">Complete identity verification above to start adding products</span>
                  </div>
                )}

                {/* Product Cards with Edit/Delete */}
                {products.map((p) => (
                  <div key={p.id} className="relative group">
                    <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => openEditProduct(p)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="destructive" className="h-8 w-8">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete product?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently remove "{p.title}" and cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProduct(p.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="bg-card rounded-lg overflow-hidden shadow-card border border-border">
                      <div className="aspect-square overflow-hidden">
                        <img src={p.images?.[0] || productSaree} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-display font-semibold text-foreground text-sm line-clamp-2 mb-1">{p.title}</h3>
                        <p className="text-lg font-bold font-display text-foreground">{formatINR(p.price)}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>Qty: {p.quantity}</span>
                          {p.region && <><span>·</span><span>{p.region}</span></>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-lg border border-border">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-display text-lg text-foreground">No orders yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Orders will appear here when customers buy your products.</p>
                </div>
              ) : orders.map((order) => {
                const currentIndex = stageOrder.indexOf(order.status);
                const isDelivered = order.status === "delivered";
                const isCancelled = order.status === "cancelled";
                return (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-lg border border-border p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img src={order.products?.images?.[0] || productSaree} alt="" className="w-14 h-14 rounded-lg object-cover" />
                        <div>
                          <h3 className="font-display font-semibold text-foreground text-sm line-clamp-1">{order.products?.title || "Product"}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Customer: {order.customer_profile?.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            {order.quantity && ` · Qty: ${order.quantity}`} · {formatINR(order.total_amount)}
                          </p>
                        </div>
                      </div>
                      <Badge className={isDelivered ? "bg-secondary/20 text-secondary border-0" : isCancelled ? "bg-destructive/20 text-destructive border-0" : "bg-primary/10 text-primary border-0"}>
                        {stageLabels[order.status] || order.status}
                      </Badge>
                    </div>
                    {!isCancelled && (
                      <>
                        <div className="flex items-center gap-1 mb-3">
                          {stageOrder.map((stage, i) => {
                            const done = i <= currentIndex;
                            const active = i === currentIndex;
                            return (
                              <div key={stage} className="flex items-center flex-1">
                                <div className={`relative group/stage w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${done ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"} ${active ? "ring-2 ring-secondary/30" : ""}`}>
                                  {done ? "✓" : i + 1}
                                  {/* Tooltip with stage label */}
                                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground whitespace-nowrap opacity-0 group-hover/stage:opacity-100 transition-opacity">
                                    {stageLabels[stage]}
                                  </span>
                                </div>
                                {i < stageOrder.length - 1 && <div className={`h-0.5 flex-1 mx-0.5 rounded ${done ? "bg-secondary" : "bg-muted"}`} />}
                              </div>
                            );
                          })}
                        </div>
                        {/* Current stage image upload + previously uploaded stage images */}
                        <div className="flex flex-wrap gap-2 mt-4 mb-3">
                          {/* Show previously uploaded images (read-only) */}
                          {stageOrder.filter((stage, i) => i < currentIndex && order.stage_images?.[stage]).map((stage) => (
                            <div key={stage} className="relative">
                              <div className="w-14 h-14 rounded-lg overflow-hidden border border-border">
                                <img src={order.stage_images![stage]} alt={stageLabels[stage]} className="w-full h-full object-cover" />
                              </div>
                              <p className="text-[8px] text-muted-foreground text-center mt-0.5">{stageLabels[stage]}</p>
                            </div>
                          ))}
                          {/* Upload for current stage only */}
                          {!isDelivered && (() => {
                            const currentStage = stageOrder[currentIndex];
                            const stageImg = order.stage_images?.[currentStage];
                            return (
                              <div className="relative">
                                <label className="cursor-pointer">
                                  {stageImg ? (
                                    <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-primary relative group/img">
                                      <img src={stageImg} alt={stageLabels[currentStage]} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera className="h-4 w-4 text-background" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-14 h-14 rounded-lg border-2 border-dashed border-primary/50 hover:border-primary flex flex-col items-center justify-center text-primary/70 hover:text-primary transition-colors">
                                      <Camera className="h-3.5 w-3.5" />
                                    </div>
                                  )}
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleStageImageUpload(order.id, currentStage, file);
                                    e.target.value = "";
                                  }} />
                                </label>
                                <p className="text-[8px] text-primary text-center mt-0.5 font-medium">{stageLabels[currentStage]}</p>
                              </div>
                            );
                          })()}
                        </div>
                      </>
                    )}
                    {/* Contact Customer - only if customer enabled allow_contact */}
                    {!isCancelled && order.customer_profile?.allow_contact && (
                      <div className="flex flex-wrap gap-2 mb-3 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs"
                          onClick={() => {
                            const startChat = async () => {
                              const { data: existing } = await supabase
                                .from("messages")
                                .select("id")
                                .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${order.customer_id}),and(sender_id.eq.${order.customer_id},receiver_id.eq.${user!.id})`)
                                .limit(1);
                              if (!existing || existing.length === 0) {
                                await supabase.from("messages").insert({
                                  sender_id: user!.id,
                                  receiver_id: order.customer_id,
                                  content: `Hi! I have an update about your order for "${order.products?.title || 'a product'}".`,
                                });
                              }
                              navigate("/messages");
                            };
                            startChat();
                          }}
                        >
                          <Send className="h-3.5 w-3.5 mr-1" /> Chat
                        </Button>
                        {acceptedArtisanCallUrls.has(order.id) ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs"
                              onClick={() => {
                                const url = acceptedArtisanCallUrls.get(order.id)!;
                                const win = window.open(url, "_blank");
                                if (win) setArtisanCallWindows((prev) => new Map(prev).set(order.id, win));
                              }}
                            >
                              <Video className="h-3.5 w-3.5 mr-1" /> Join Call
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs"
                              onClick={async () => {
                                await supabase.from("video_call_requests").update({ status: "ended" } as any)
                                  .eq("order_id", order.id).eq("artisan_id", user!.id).eq("status", "accepted");
                                setAcceptedArtisanCallUrls((prev) => { const n = new Map(prev); n.delete(order.id); return n; });
                                toast({ title: "Call ended" });
                              }}
                            >
                              <PhoneOff className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : pendingArtisanCalls.has(order.id) ? (
                          <Button size="sm" variant="outline" disabled className="text-xs border-muted-foreground text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 mr-1 animate-pulse" /> Waiting for Customer…
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs"
                            onClick={() => requestVideoCallToCustomer(order)}
                          >
                            <Video className="h-3.5 w-3.5 mr-1" /> Video Call Customer
                          </Button>
                        )}
                      </div>
                    )}
                    {!isCancelled && !order.customer_profile?.allow_contact && (
                      <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                        <PhoneOff className="h-3 w-3" /> Customer has not enabled contact
                      </p>
                    )}
                    {!isDelivered && !isCancelled && (
                      <Button size="sm" onClick={() => advanceOrder(order.id, order.status)} disabled={updatingOrder === order.id} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs">
                        {updatingOrder === order.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                        Advance to {stageLabels[stageOrder[currentIndex + 1]] || "Next"}
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <ProducerAnalytics orders={orders.map(o => ({ id: o.id, status: o.status, total_amount: o.total_amount, created_at: o.created_at }))} />
            </TabsContent>

            {/* Brand Tab */}
            <TabsContent value="brand">
              <div className="bg-card rounded-lg border border-border p-6 shadow-card">
                <BrandSettings />
              </div>
            </TabsContent>
          </Tabs>

          {/* Edit Product Dialog */}
          <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setEditingProduct(null); resetProductForm(); } }}>
            <DialogContent className="bg-card max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-display">Edit Product</DialogTitle></DialogHeader>
              {renderProductForm(handleEditProduct, "Save Changes")}
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Footer />

    </div>
  );
};

export default ArtisanDashboard;
