import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import AIRecommendations from "@/components/AIRecommendations";
import VoiceSearch from "@/components/VoiceSearch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import productSaree from "@/assets/product-saree.jpg";

const categories = ["All", "Sarees", "Pottery", "Paintings", "Shawls", "Textiles", "Metalwork", "Jewellery", "Woodwork", "Himalayan Herbs", "Tribal Weaves"];
const regions = ["All Regions", "Varanasi", "Jaipur", "Madhubani", "Srinagar", "Lucknow", "Kutch", "Himachal", "Nagaland", "Bastar", "Odisha", "Assam"];
const priceRanges = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under ₹5,000", min: 0, max: 5000 },
  { label: "₹5,000 – ₹15,000", min: 5000, max: 15000 },
  { label: "₹15,000 – ₹30,000", min: 15000, max: 30000 },
  { label: "Above ₹30,000", min: 30000, max: Infinity },
];

type SortOption = "newest" | "price_asc" | "price_desc" | "rating";

const fetchShopProducts = async () => {
  const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  if (!data) return [];

  const artisanIds = [...new Set(data.map((p) => p.artisan_id))];
  const [{ data: profiles }, { data: pendingRequests }] = await Promise.all([
    supabase.from("profiles").select("user_id, full_name, is_verified").in("user_id", artisanIds),
    supabase.from("verification_requests").select("artisan_id, status").eq("status", "pending").in("artisan_id", artisanIds),
  ]);
  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
  const pendingSet = new Set(pendingRequests?.map((r) => r.artisan_id) || []);

  return data.map((p) => ({
    ...p,
    artisan_name: profileMap.get(p.artisan_id)?.full_name || "Artisan",
    artisan_verified: profileMap.get(p.artisan_id)?.is_verified || false,
    verification_pending: pendingSet.has(p.artisan_id),
  }));
};

const Shop = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && categories.includes(cat)) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: fetchShopProducts,
    staleTime: 60_000,
  });

  const filtered = products
    .filter((p) => {
      const q = search.toLowerCase();
      if (q && !p.title.toLowerCase().includes(q) && !p.artisan_name?.toLowerCase().includes(q)) return false;
      if (selectedCategory !== "All" && p.category?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      if (selectedRegion !== "All Regions" && !p.region?.toLowerCase().includes(selectedRegion.toLowerCase())) return false;
      const range = priceRanges[selectedPrice];
      if (p.price < range.min || p.price > range.max) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price_asc": return a.price - b.price;
        case "price_desc": return b.price - a.price;
        case "rating": return (b.rating || 0) - (a.rating || 0);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const activeFilters = [
    selectedCategory !== "All" ? selectedCategory : null,
    selectedRegion !== "All Regions" ? selectedRegion : null,
    selectedPrice !== 0 ? priceRanges[selectedPrice].label : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Explore Handcrafted Treasures</h1>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">Every piece tells a story. Discover authentic crafts from verified artisans across India.</p>
          </motion.div>

          <AIRecommendations browsingContext={selectedCategory !== "All" ? `Looking at ${selectedCategory}` : undefined} />

          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search crafts or artisans..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <VoiceSearch onResult={(transcript) => setSearch(transcript)} />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_asc">Price: Low → High</SelectItem>
                <SelectItem value="price_desc">Price: High → Low</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="border-border text-muted-foreground hover:text-foreground">
              <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
            </Button>
          </div>

          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="bg-card rounded-lg border border-border p-5 mb-6 space-y-5">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <Button key={c} size="sm" variant={selectedCategory === c ? "default" : "outline"} onClick={() => setSelectedCategory(c)} className="text-xs">{c}</Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Region</p>
                <div className="flex flex-wrap gap-2">
                  {regions.map((r) => (
                    <Button key={r} size="sm" variant={selectedRegion === r ? "default" : "outline"} onClick={() => setSelectedRegion(r)} className="text-xs">{r}</Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Price Range</p>
                <div className="flex flex-wrap gap-2">
                  {priceRanges.map((pr, i) => (
                    <Button key={pr.label} size="sm" variant={selectedPrice === i ? "default" : "outline"} onClick={() => setSelectedPrice(i)} className="text-xs">{pr.label}</Button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <span className="text-sm text-muted-foreground">Active:</span>
              {activeFilters.map((f) => (
                <Badge key={f} variant="secondary" className="gap-1">
                  {f}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => {
                    if (categories.includes(f!)) setSelectedCategory("All");
                    if (regions.includes(f!)) setSelectedRegion("All Regions");
                    if (priceRanges.some((pr) => pr.label === f)) setSelectedPrice(0);
                  }} />
                </Badge>
              ))}
              <button onClick={() => { setSelectedCategory("All"); setSelectedRegion("All Regions"); setSelectedPrice(0); }} className="text-xs text-primary hover:underline">Clear all</button>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-4">{filtered.length} products found</p>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg border border-border animate-pulse aspect-[3/4]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg font-display text-foreground">No products found</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filtered.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                  <ProductCard
                    id={p.id} image={p.images?.[0] || productSaree} title={p.title}
                    artisan={p.artisan_name || "Artisan"} region={p.region || "India"}
                    price={p.price} originalPrice={p.original_price || undefined}
                    rating={p.rating || 0} reviews={p.reviews_count || 0}
                    remaining={p.quantity || undefined} isLive={p.is_live || false}
                    isVerified={p.artisan_verified}
                    verificationPending={p.verification_pending}
                    rarityTier={(p.rarity_tier as "common" | "rare" | "ultra_rare") || "common"}
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

export default Shop;
