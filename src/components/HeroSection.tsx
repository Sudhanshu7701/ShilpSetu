import { motion } from "framer-motion";
import { Play, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-loom.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[80vh] sm:min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Traditional Indian handloom with vibrant silk threads"
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-hero)" }}
        />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-secondary/20 text-secondary border border-secondary/30 mb-6"
          >
            🪡 Where Craft Comes Alive
          </motion.span>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold leading-[1.1] text-primary-foreground mb-6">
            <span className="sr-only">LoomLive — Loom Live Handcraft Marketplace. </span>
            Every Thread{" "}
            <span className="italic text-secondary">Tells a Story</span>
          </h1>

          <p className="text-lg sm:text-xl text-primary-foreground/80 font-body mb-8 max-w-lg leading-relaxed">
            Watch artisans weave your fabric live. Shop handcrafted Indian art
            directly from the makers who pour generations of skill into every piece.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link to="/shop" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-gold-light font-semibold text-base px-8 min-h-[48px] shadow-gold"
              >
                Explore Crafts
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/live-events" className="w-full sm:w-auto">
              <button
                className="w-full sm:w-auto inline-flex items-center justify-center h-12 sm:h-11 rounded-md border-2 border-white text-white font-medium text-base px-8 hover:bg-white/20 active:bg-white/30 transition-colors"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Live
              </button>
            </Link>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex gap-6 sm:gap-8 mt-10 sm:mt-12"
          >
            {[
              { value: "2,500+", label: "Artisans" },
              { value: "18", label: "States" },
              { value: "50K+", label: "Crafts Sold" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-display font-bold text-secondary">
                  {stat.value}
                </p>
                <p className="text-sm text-primary-foreground/60">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
