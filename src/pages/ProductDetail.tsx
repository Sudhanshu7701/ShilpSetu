import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { notifyOrderPlaced } from "@/lib/notifications";
import { useCart } from "@/contexts/CartContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, Share2, Star, MapPin, ShieldCheck, Truck, Video,
  MessageCircle, ChevronRight, Minus, Plus, Loader2, ShoppingCart, Clock,
} from "lucide-react";
import ReviewSection from "@/components/ReviewSection";
import productSaree from "@/assets/product-saree.jpg";
import artisan1 from "@/assets/artisan-1.jpg";

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const stageOrder = ["placed", "design", "weaving", "finishing", "quality_check", "dispatch", "delivered"];
const stageLabels: Record<string, string> = {
  placed: "Placed", design: "Design", weaving: "Weaving", finishing: "Finishing",
  quality_check: "QC", dispatch: "Dispatch", delivered: "Delivered",
};

const fetchProductData = async (slug: string | undefined, userId: string | undefined) => {
  let query = supabase.from("products").select("*");
  if (slug && slug.match(/^[0-9a-f]{8}-/)) {
    query = query.eq("id", slug);
  } else {
    query = query.limit(1);
  }
  const { data: product } = await query.single();
  if (!product) return { product: null, artisan: null, wishlisted: false, existingOrder: null };

  // Run all secondary queries in parallel
  const [artisanRes, pendingRes, ...userResults] = await Promise.all([
    supabase.from("profiles").select("user_id, full_name, avatar_url, is_verified, region").eq("user_id", product.artisan_id).single(),
    supabase.from("verification_requests").select("id").eq("artisan_id", product.artisan_id).eq("status", "pending").maybeSingle(),
    ...(userId ? [
      supabase.from("wishlists").select("id").eq("user_id", userId).eq("product_id", product.id).maybeSingle(),
      supabase.from("orders").select("*").eq("customer_id", userId).eq("product_id", product.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ] : []),
  ]);

  return {
    product,
    artisan: artisanRes.data,
    verificationPending: !!(pendingRes as any)?.data,
    wishlisted: !!(userResults[0] as any)?.data,
    existingOrder: (userResults[1] as any)?.data || null,
  };
};

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);
  const [wishlistedLocal, setWishlistedLocal] = useState<boolean | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["product", slug, user?.id],
    queryFn: () => fetchProductData(slug, user?.id),
    staleTime: 60_000,
  });

  const product = data?.product;
  const artisan = data?.artisan;
  const wishlisted = wishlistedLocal ?? data?.wishlisted ?? false;
  const existingOrder = data?.existingOrder;
  const verificationPending = data?.verificationPending ?? false;

  const handleBuy = async () => {
    if (!user) { toast({ title: "Please sign in" }); navigate("/auth"); return; }
    if (!product) return;
    setBuying(true);
    try {
      const { error: orderError } = await supabase.from("orders").insert({
        customer_id: user.id, product_id: product.id, artisan_id: product.artisan_id,
        quantity: qty, total_amount: product.price * qty,
      });
      if (orderError) throw orderError;

      // Notify artisan + send confirmation email to customer
      const customerName = user.user_metadata?.full_name || user.email || "Customer";
      notifyOrderPlaced(
        product.artisan_id, product.title, customerName, product.id,
        user.email || undefined, product.price * qty, qty, artisan?.full_name
      );

      const { data: checkoutData, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          product_title: product.title, amount: product.price, quantity: qty,
          product_id: product.id, artisan_id: product.artisan_id, customer_email: user.email,
        },
      });
      if (error) throw error;
      if (checkoutData?.url) {
        window.open(checkoutData.url, '_blank');
        toast({ title: "Redirecting to payment…", description: "A new tab has been opened for checkout." });
        queryClient.invalidateQueries({ queryKey: ["product", slug] });
      } else {
        toast({ title: "Order placed! 🎉" });
        queryClient.invalidateQueries({ queryKey: ["product", slug] });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setBuying(false);
  };

  const toggleWishlist = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!product) return;
    const newState = !wishlisted;
    setWishlistedLocal(newState);
    if (wishlisted) {
      await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", product.id);
      toast({ title: "Removed from wishlist" });
    } else {
      await supabase.from("wishlists").insert({ user_id: user.id, product_id: product.id });
      toast({ title: "Added to wishlist ❤️" });
    }
  };

  const sendMessageToArtisan = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!product) return;
    await supabase.from("messages").insert({
      sender_id: user.id, receiver_id: product.artisan_id,
      content: `Hi! I'm interested in your product: "${product.title}"`,
    });
    toast({ title: "Message sent!" });
    navigate("/messages");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 text-center py-20">
          <h1 className="font-display text-2xl text-foreground">Product not found</h1>
          <Button className="mt-4" asChild><Link to="/shop">Browse Shop</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const images = product.images?.length ? product.images : [productSaree];
  const maxQty = product.quantity || 10;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/shop" className="hover:text-foreground">Shop</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground line-clamp-1">{product.title}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Gallery */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-4">
                <img src={images[selectedImage]} alt={product.title} className="w-full h-full object-cover" />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImage(i)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === i ? "border-primary" : "border-transparent"}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Details */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-2 mb-3">
                {artisan?.is_verified && (
                  <Badge className="bg-secondary/20 text-secondary border-0 text-xs">
                    <ShieldCheck className="h-3 w-3 mr-1" /> GI Certified
                  </Badge>
                )}
                {!artisan?.is_verified && verificationPending && (
                  <Badge className="bg-accent text-accent-foreground border-0 text-xs gap-1">
                    <Clock className="h-3 w-3" /> Pending Verification
                  </Badge>
                )}
                {product.quantity && product.quantity <= 5 && (
                  <Badge className="bg-primary/10 text-primary border-0 text-xs">Only {product.quantity} left</Badge>
                )}
                {product.is_live && (
                  <Badge className="bg-primary text-primary-foreground border-0 text-xs gap-1">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> LIVE
                  </Badge>
                )}
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-snug">{product.title}</h1>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-secondary text-secondary" />
                  <span className="font-medium text-foreground">{product.rating || 0}</span>
                  <span className="text-sm text-muted-foreground">({product.reviews_count || 0} reviews)</span>
                </div>
                {product.region && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {product.region}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-baseline gap-3 mt-6">
                <span className="text-3xl font-display font-bold text-foreground">{formatINR(product.price)}</span>
                {product.original_price && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">{formatINR(product.original_price)}</span>
                    <Badge className="bg-secondary/20 text-secondary border-0 text-xs">
                      {Math.round((1 - product.price / product.original_price) * 100)}% OFF
                    </Badge>
                  </>
                )}
              </div>

              {artisan && (
                <Link to={`/artisan/${artisan.user_id}`}
                  className="flex items-center gap-3 mt-6 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors">
                  <img src={artisan.avatar_url || artisan1} alt={artisan.full_name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-secondary/30" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-foreground">{artisan.full_name}</span>
                      {artisan.is_verified && <ShieldCheck className="h-4 w-4 text-secondary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{artisan.region || "India"}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              )}

              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center border border-border rounded-lg">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 text-muted-foreground hover:text-foreground"><Minus className="h-4 w-4" /></button>
                  <span className="px-4 font-medium text-foreground">{qty}</span>
                  <button onClick={() => setQty(Math.min(maxQty, qty + 1))} className="p-2 text-muted-foreground hover:text-foreground"><Plus className="h-4 w-4" /></button>
                </div>
                <span className="text-sm text-muted-foreground">Total: {formatINR(product.price * qty)}</span>
              </div>

              <div className="flex gap-3 mt-4">
                <Button onClick={() => {
                  addItem({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: images[0],
                    artisan_id: product.artisan_id,
                    artisan_name: artisan?.full_name || "Artisan",
                    region: product.region || "India",
                    max_quantity: maxQty,
                    quantity: qty,
                  });
                  toast({ title: "Added to cart 🛒" });
                }}
                  className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base py-5">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button onClick={handleBuy} disabled={buying}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-base py-5">
                  {buying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {buying ? "Placing Order..." : "Buy Now"}
                </Button>
                <Button variant="outline" size="icon" onClick={toggleWishlist}
                  className={`border-border h-12 w-12 ${wishlisted ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary"}`}>
                  <Heart className={`h-5 w-5 ${wishlisted ? "fill-current" : ""}`} />
                </Button>
                <Button variant="outline" size="icon" className="border-border text-muted-foreground hover:text-primary h-12 w-12"
                  onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copied! 📋" }); }}>
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex gap-3 mt-3">
                <Button variant="outline" onClick={sendMessageToArtisan}
                  className="flex-1 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                  <MessageCircle className="h-4 w-4 mr-2" /> Message Artisan
                </Button>
                <Link to="/live-events" className="flex-1">
                  <Button variant="outline" className="w-full border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                    <Video className="h-4 w-4 mr-2" /> Watch Live
                  </Button>
                </Link>
              </div>

              {product.description && (
                <div className="mt-8">
                  <h3 className="font-display font-semibold text-foreground mb-2">About This Craft</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                </div>
              )}

              <ReviewSection productId={product.id} />

              {existingOrder && (
                <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Truck className="h-4 w-4 text-secondary" />
                    <h3 className="font-display font-semibold text-foreground text-sm">Your Order Status</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {stageOrder.map((stage, i) => {
                      const currentIndex = stageOrder.indexOf(existingOrder.status);
                      const done = i <= currentIndex;
                      const active = i === currentIndex;
                      return (
                        <div key={stage} className="flex items-center flex-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${done ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"} ${active ? "ring-2 ring-secondary/30" : ""}`}>
                            {done ? "✓" : i + 1}
                          </div>
                          {i < stageOrder.length - 1 && (
                            <div className={`h-0.5 flex-1 mx-0.5 rounded ${done ? "bg-secondary" : "bg-muted"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2">
                    {stageOrder.map((s) => (
                      <span key={s} className="text-[8px] text-muted-foreground text-center flex-1">{stageLabels[s]}</span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProductDetail;
