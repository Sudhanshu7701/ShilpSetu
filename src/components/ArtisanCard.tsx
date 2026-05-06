import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeCheck, MapPin, Star } from "lucide-react";

interface ArtisanCardProps {
  id?: string;
  image: string;
  name: string;
  region: string;
  craft: string;
  rating: number;
  products: number;
  verified?: boolean;
}

const ArtisanCard = ({
  id,
  image,
  name,
  region,
  craft,
  rating,
  products,
  verified,
}: ArtisanCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="group bg-card rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-shadow border border-border text-center p-6"
    >
      <div className="relative w-24 h-24 mx-auto mb-4">
        <img
          src={image}
          alt={name}
          className="w-full h-full rounded-full object-cover ring-3 ring-secondary/30"
          loading="lazy"
        />
        {verified && (
          <div className="absolute -bottom-1 -right-1 bg-secondary text-secondary-foreground rounded-full p-1">
            <BadgeCheck className="h-4 w-4" />
          </div>
        )}
      </div>

      <h3 className="font-display font-semibold text-foreground text-lg">{name}</h3>

      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
        <MapPin className="h-3 w-3" />
        <span>{region}</span>
      </div>

      <span className="inline-block mt-2 px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground font-medium">
        {craft}
      </span>

      <div className="flex items-center justify-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
          <span className="font-medium text-foreground">{rating}</span>
        </div>
        <span className="text-border">|</span>
        <span className="text-muted-foreground">{products} products</span>
      </div>

      <Link
        to={id ? `/artisan/${id}` : "/shop"}
        className="mt-4 w-full min-h-[48px] py-3 rounded-md border border-primary text-primary text-sm font-medium hover:bg-primary hover:text-primary-foreground active:scale-[0.98] transition-all inline-flex items-center justify-center"
      >
        View Profile
      </Link>
    </motion.div>
  );
};

export default ArtisanCard;
