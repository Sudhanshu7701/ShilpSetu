import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  BadgeCheck,
  MapPin,
  Star,
  Package,
  Heart,
  MessageCircle,
  Users,
  Loader2,
} from "lucide-react";

import artisan1 from "@/assets/artisan-1.jpg";
import productSaree from "@/assets/product-saree.jpg";

interface ArtisanData {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  region: string | null;
  specialties: string[] | null;
  is_verified: boolean | null;
  followers_count: number | null;
}

interface ProductData {
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
}

const ArtisanProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [artisan, setArtisan] = useState<ArtisanData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchArtisan();
  }, [id]);

  useEffect(() => {
    if (user && artisan) checkFollow();
  }, [user, artisan]);

  const fetchArtisan = async () => {
    setLoading(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", id!)
      .single();

    if (profile) {
      setArtisan(profile as ArtisanData);
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("artisan_id", id!)
        .order("created_at", { ascending: false });
      if (prods) setProducts(prods);
    }
    setLoading(false);
  };

  const checkFollow = async () => {
    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user!.id)
      .eq("artisan_id", artisan!.user_id)
      .maybeSingle();
    setIsFollowing(!!data);
  };

  const toggleFollow = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!artisan) return;

    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("artisan_id", artisan.user_id);
      setIsFollowing(false);
      toast({ title: "Unfollowed" });
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, artisan_id: artisan.user_id });
      setIsFollowing(true);
      toast({ title: "Following! 🎉" });
    }
  };

  const sendMessage = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!artisan) return;
    // Check if conversation already exists to avoid duplicate messages
    const { data: existing } = await supabase
      .from("messages")
      .select("id")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${artisan.user_id}),and(sender_id.eq.${artisan.user_id},receiver_id.eq.${user.id})`)
      .limit(1);
    if (!existing || existing.length === 0) {
      await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: artisan.user_id,
        content: `Hi! I'd love to learn more about your crafts.`,
      });
    }
    toast({ title: "Opening chat…" });
    navigate("/messages");
  };

  if (loading) {
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

  if (!artisan) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 text-center py-20">
          <h1 className="font-display text-2xl text-foreground">Artisan not found</h1>
          <Button className="mt-4" asChild><Link to="/shop">Browse Shop</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-6 sm:p-8 border border-border shadow-card mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                <img
                  src={artisan.avatar_url || artisan1}
                  alt={artisan.full_name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-secondary/30"
                />
                {artisan.is_verified && (
                  <div className="absolute bottom-1 right-1 bg-secondary text-secondary-foreground rounded-full p-1.5">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  {artisan.full_name}
                </h1>
                {artisan.region && (
                  <p className="flex items-center justify-center sm:justify-start gap-1 text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" /> {artisan.region}
                  </p>
                )}

                {artisan.specialties && artisan.specialties.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                    {artisan.specialties.map((s) => (
                      <Badge key={s} variant="secondary" className="bg-muted text-muted-foreground border-0 text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}

                {artisan.bio && (
                  <p className="text-sm text-muted-foreground mt-4 max-w-xl leading-relaxed">
                    {artisan.bio}
                  </p>
                )}

                <div className="flex items-center justify-center sm:justify-start gap-6 mt-5">
                  {[
                    { icon: Package, value: products.length, label: "Products" },
                    { icon: Users, value: artisan.followers_count || 0, label: "Followers" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-lg font-display font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-5">
                  <Button
                    onClick={toggleFollow}
                    className={isFollowing ? "bg-muted text-foreground hover:bg-muted/80" : "bg-primary text-primary-foreground hover:bg-primary/90"}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${isFollowing ? "fill-current" : ""}`} />
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={sendMessage}
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" /> Message
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Products Grid */}
          <h2 className="font-display text-xl font-semibold text-foreground mb-6">
            Products by {artisan.full_name}
          </h2>
          {products.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-lg border border-border">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-display text-lg text-foreground">No products yet</p>
              <p className="text-sm text-muted-foreground mt-1">This artisan hasn't listed any products.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <ProductCard
                    id={p.id}
                    image={p.images?.[0] || productSaree}
                    title={p.title}
                    artisan={artisan.full_name}
                    region={p.region || artisan.region || "India"}
                    price={p.price}
                    originalPrice={p.original_price || undefined}
                    rating={p.rating || 0}
                    reviews={p.reviews_count || 0}
                    remaining={p.quantity || undefined}
                    isLive={p.is_live || false}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ArtisanProfile;
