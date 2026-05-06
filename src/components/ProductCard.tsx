import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Star, MapPin, Eye, ShieldCheck, Clock, Gem, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  id?: string;
  image: string;
  title: string;
  artisan: string;
  region: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  remaining?: number;
  isLive?: boolean;
  isVerified?: boolean;
  verificationPending?: boolean;
  rarityTier?: "common" | "rare" | "ultra_rare";
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const ProductCard = ({
  id,
  image,
  title,
  artisan,
  region,
  price,
  originalPrice,
  rating,
  reviews,
  remaining,
  isLive,
  isVerified,
  verificationPending,
  rarityTier = "common",
}: ProductCardProps) => {
  const isRare = rarityTier === "rare";
  const isUltra = rarityTier === "ultra_rare";
  const hasRarity = isRare || isUltra;

  const content = (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className={`group bg-card rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300 border h-full ${
        isUltra ? "border-rarity-ultra/40 ring-1 ring-rarity-ultra/20" : isRare ? "border-rarity-rare/30" : "border-border"
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          decoding="async"
        />
        <button
          className="absolute top-3 right-3 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-primary active:scale-95 transition-all"
          onClick={(e) => e.preventDefault()}
          aria-label="Add to wishlist"
        >
          <Heart className="h-5 w-5" />
        </button>
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            LIVE
          </div>
        )}
        {/* Rarity Badge */}
        {hasRarity && (
          <div className={`absolute top-3 left-3 ${isLive ? "top-12" : ""} flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
            isUltra 
              ? "bg-rarity-ultra/90 text-foreground shadow-[var(--rarity-ultra-glow)]" 
              : "bg-rarity-rare/90 text-primary-foreground shadow-[var(--rarity-rare-glow)]"
          }`}>
            {isUltra ? <Sparkles className="h-3 w-3" /> : <Gem className="h-3 w-3" />}
            {isUltra ? "ULTRA RARE" : "RARE FIND"}
          </div>
        )}
        {/* Urgency - enhanced with pulse */}
        {remaining != null && remaining <= 5 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
            <Badge className="bg-primary/90 text-primary-foreground text-xs border-0 animate-pulse">
              🔥 Only {remaining} left
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
          <MapPin className="h-3 w-3" />
          <span>{region}</span>
          <span className="mx-1">·</span>
          <span className="text-foreground font-medium">{artisan}</span>
          {isVerified && <ShieldCheck className="h-3.5 w-3.5 text-secondary shrink-0" />}
          {!isVerified && verificationPending && (
            <Badge className="bg-accent text-accent-foreground border-0 text-[10px] px-1.5 py-0 gap-0.5">
              <Clock className="h-2.5 w-2.5" /> Pending
            </Badge>
          )}
        </div>

        <h3 className="font-display font-semibold text-foreground text-base leading-snug mb-2 line-clamp-2">
          {title}
        </h3>

        <div className="flex items-center gap-1 mb-3">
          <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
          <span className="text-sm font-medium text-foreground">{rating}</span>
          <span className="text-xs text-muted-foreground">({reviews})</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold font-display text-foreground">
              {formatINR(price)}
            </span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatINR(originalPrice)}
              </span>
            )}
          </div>
          <div className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all">
            <Eye className="h-5 w-5" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (id) {
    return <Link to={`/product/${id}`}>{content}</Link>;
  }

  return content;
};

export default ProductCard;
