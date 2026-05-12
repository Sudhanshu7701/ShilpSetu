import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Users, Clock, Calendar, MapPin } from "lucide-react";

import artisan1 from "@/assets/artisan-1.jpg";
import artisan2 from "@/assets/artisan-2.jpg";
import artisan3 from "@/assets/artisan-3.jpg";

const placeholderEvents = [
  {
    id: "1",
    title: "Banarasi Silk Weaving — Live from Varanasi",
    description: "Watch master weaver Lakshmi Devi create an intricate gold zari pattern on a traditional handloom.",
    artisan_name: "Lakshmi Devi",
    region: "Varanasi, UP",
    thumbnail: artisan1,
    scheduled_at: new Date(Date.now() + 2 * 3600000).toISOString(),
    status: "live",
    viewers_count: 234,
  },
  {
    id: "2",
    title: "Blue Pottery Masterclass — Jaipur Heritage",
    description: "Ramesh Kumar demonstrates the ancient art of blue pottery with natural dyes and quartz stone.",
    artisan_name: "Ramesh Kumar",
    region: "Jaipur, Rajasthan",
    thumbnail: artisan2,
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    status: "scheduled",
    viewers_count: 0,
  },
  {
    id: "3",
    title: "Madhubani Painting — From Sketch to Colour",
    description: "Sita Devi paints a traditional fish and lotus motif using natural pigments on handmade paper.",
    artisan_name: "Sita Devi",
    region: "Madhubani, Bihar",
    thumbnail: artisan3,
    scheduled_at: new Date(Date.now() + 172800000).toISOString(),
    status: "scheduled",
    viewers_count: 0,
  },
];

const Countdown = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Starting now!"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return <span>{timeLeft}</span>;
};

const LiveEvents = () => {
  const { toast } = useToast();
  const [events] = useState(placeholderEvents);
  const liveEvents = events.filter((e) => e.status === "live");
  const upcomingEvents = events.filter((e) => e.status === "scheduled");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="text-sm font-medium text-secondary tracking-wider uppercase">Live Studio</span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-2">
              Live Weaving Events
            </h1>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Watch artisans create masterpieces in real-time. Ask questions, learn techniques, and order during live sessions.
            </p>
          </motion.div>

          {/* Live Now */}
          {liveEvents.length > 0 && (
            <div className="mb-12">
              <h2 className="font-display text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                Live Now
              </h2>
              {liveEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid lg:grid-cols-2 gap-8 bg-card rounded-xl border border-border overflow-hidden shadow-card"
                >
                  <div className="relative aspect-video lg:aspect-auto">
                    <img src={event.thumbnail} alt={event.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-foreground/20 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-secondary/90 flex items-center justify-center text-secondary-foreground shadow-gold">
                        <Play className="h-8 w-8 ml-1" />
                      </div>
                    </div>
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                      LIVE
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-primary-foreground text-sm">
                      <span className="flex items-center gap-1.5 bg-foreground/30 backdrop-blur-sm px-3 py-1 rounded-full">
                        <Users className="h-4 w-4" /> {event.viewers_count} watching
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col justify-center">
                    <h3 className="font-display text-2xl font-bold text-foreground">{event.title}</h3>
                    <p className="text-muted-foreground mt-2">{event.description}</p>
                    <div className="flex items-center gap-3 mt-4 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{event.artisan_name}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.region}</span>
                    </div>
                    <Button className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 w-fit"
                      onClick={() => toast({ title: "🎬 Live streaming coming soon!", description: "This feature is under development." })}>
                      <Play className="h-4 w-4 mr-2" /> Join Live Session
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Upcoming Events */}
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-secondary" />
              Upcoming Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-lg border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-shadow"
                >
                  <div className="relative aspect-video">
                    <img src={event.thumbnail} alt={event.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-card/90 backdrop-blur-sm text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-secondary" />
                      <Countdown targetDate={event.scheduled_at} />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-semibold text-foreground leading-snug line-clamp-2">{event.title}</h3>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{event.artisan_name}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.region}</span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.scheduled_at).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                        {" · "}
                        {new Date(event.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <Button size="sm" variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground text-xs"
                        onClick={() => toast({ title: "🔔 Reminder set!", description: `We'll notify you before "${event.title}" starts.` })}>
                        Remind Me
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {upcomingEvents.length === 0 && liveEvents.length === 0 && (
            <div className="text-center py-20">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-display text-lg text-foreground">No events scheduled</p>
              <p className="text-sm text-muted-foreground mt-1">Check back soon for live weaving sessions!</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LiveEvents;
