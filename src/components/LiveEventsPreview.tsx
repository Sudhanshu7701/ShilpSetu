import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import artisan1 from "@/assets/artisan-1.jpg";

const LiveEventsPreview = () => {
  return (
    <section id="live" className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-xl overflow-hidden aspect-[4/3]"
          >
            <img
              src={artisan1}
              alt="Artisan weaving live"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-foreground/30 flex items-center justify-center">
              <Link to="/live-events" className="w-16 h-16 rounded-full bg-secondary/90 flex items-center justify-center text-secondary-foreground shadow-gold hover:scale-110 transition-transform">
                <Play className="h-7 w-7 ml-1" />
              </Link>
            </div>
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              LIVE NOW
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-primary-foreground text-sm">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" /> 234 watching
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> 1:23:45
              </span>
            </div>
          </motion.div>

          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="text-sm font-medium text-secondary tracking-wider uppercase">
              Live Weaving Studio
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-2 mb-4">
              Watch Your Fabric Come to Life
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Join live weaving sessions hosted by master artisans. Watch every thread being
              woven, ask questions in real-time, and experience the magic of handloom
              craftsmanship from the comfort of your home.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Schedule video calls with artisans after ordering",
                "Live chat during weaving sessions",
                "Track your order's production in real-time",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/live-events">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                Browse Live Events
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LiveEventsPreview;
