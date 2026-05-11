import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import ArtisanCard from "@/components/ArtisanCard";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

import productSaree from "@/assets/product-saree.jpg";
import productPottery from "@/assets/product-pottery.jpg";
import productMadhubani from "@/assets/product-madhubani.jpg";
import productPashmina from "@/assets/product-pashmina.jpg";
import artisan1 from "@/assets/artisan-1.jpg";
import artisan2 from "@/assets/artisan-2.jpg";
import artisan3 from "@/assets/artisan-3.jpg";

// Lazy-load below-fold heavy sections
const LiveEventsPreview = lazy(() => import("@/components/LiveEventsPreview"));
const CraftHeritage = lazy(() => import("@/components/CraftHeritage"));

const imageMap: Record<string, string> = {
  saree: productSaree, silk: productSaree, banarasi: productSaree, kanchipuram: productSaree,
  pottery: productPottery, vase: productPottery, plate: productPottery,
  madhubani: productMadhubani, painting: productMadhubani,
  pashmina: productPashmina, shawl: productPashmina,
};

const getProductImage = (title: string, images?: string[] | null) => {
  if (images && images.length > 0 && images[0]) return images[0];
  const lower = title.toLowerCase();
  for (const [key, img] of Object.entries(imageMap)) {
    if (lower.includes(key)) return img;
  }
  return productSaree;
};

const artisanImages: Record<string, string> = {
  "Lakshmi Devi": artisan1, "Ramesh Kumar": artisan2, "Sita Devi": artisan3,
};

const fetchHomeData = async () => {
  const [{ data: prods }, { data: profiles }] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }).limit(4),
    supabase.from("profiles").select("*").eq("is_verified", true).limit(6),
  ]);

  let products: any[] = [];
  if (prods) {
    const artisanIds = [...new Set(prods.map((p) => p.artisan_id))];
    const { data: artisanProfiles } = await supabase
      .from("profiles").select("user_id, full_name").in("user_id", artisanIds);
    const nameMap = new Map(artisanProfiles?.map((p) => [p.user_id, p.full_name]) || []);
    products = prods.map((p) => ({
      id: p.id, image: getProductImage(p.title, p.images), title: p.title,
      artisan: nameMap.get(p.artisan_id) || "Artisan", region: p.region || "India",
      price: p.price, originalPrice: p.original_price, rating: p.rating || 0,
      reviews: p.reviews_count || 0, remaining: p.quantity, isLive: p.is_live,
    }));
  }

  const artisans = (profiles || []).map((p) => ({
    id: p.user_id, image: artisanImages[p.full_name] || artisan1, name: p.full_name,
    region: p.region || "India", craft: p.specialties?.[0] || "Handcraft",
    rating: 4.8, products: 20, verified: p.is_verified,
  }));

  return { products, artisans };
};

const SectionFallback = () => <div className="py-20" />;

const Index = () => {
  const { data } = useQuery({
    queryKey: ["home-data"],
    queryFn: fetchHomeData,
    staleTime: 120_000,
  });

  const products = data?.products || [];
  const artisans = data?.artisans || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />

      {/* Featured Products */}
      <section id="products" className="py-20 bg-textile cv-auto">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-14">
            <span className="text-sm font-medium text-secondary tracking-wider uppercase">Handpicked for You</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-2">Featured Crafts</h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">Each piece is one-of-a-kind, handcrafted by verified Indian artisans.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <ProductCard {...product} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Artisan Spotlight */}
      <section id="artisans" className="py-20 cv-auto">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-14">
            <span className="text-sm font-medium text-secondary tracking-wider uppercase">Meet the Makers</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-2">Artisan Spotlight</h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">The hands behind every masterpiece. Follow their journey.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {artisans.map((artisan, i) => (
              <motion.div key={artisan.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <ArtisanCard {...artisan} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Suspense fallback={<SectionFallback />}>
        <LiveEventsPreview />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <CraftHeritage />
      </Suspense>
      <Footer />
    </div>
  );
};

export default Index;
