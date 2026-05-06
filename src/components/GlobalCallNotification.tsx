import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PhoneIncoming, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CallRequest {
  id: string;
  customer_id: string;
  artisan_id: string;
  order_id: string;
  room_url: string | null;
  created_at: string;
  initiated_by: string;
  caller_name?: string;
}

const GlobalCallNotification = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [callRequests, setCallRequests] = useState<CallRequest[]>([]);
  const [activeCallWindow, setActiveCallWindow] = useState<{ win: Window; requestId: string } | null>(null);
  const ringtoneRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isArtisan = role === "artisan";
  const isCustomer = role === "customer";
  const isRelevant = !!user && (isArtisan || isCustomer);

  // Ringtone
  useEffect(() => {
    if (!isRelevant) return;
    const playBeep = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880; osc.type = "sine"; gain.gain.value = 0.3;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.stop(ctx.currentTime + 0.3);
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2); gain2.connect(ctx.destination);
          osc2.frequency.value = 1100; osc2.type = "sine"; gain2.gain.value = 0.3;
          osc2.start();
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
          osc2.stop(ctx.currentTime + 0.6);
          setTimeout(() => ctx.close(), 700);
        }, 350);
      } catch {}
    };

    if (callRequests.length > 0 && !ringtoneRef.current) {
      playBeep();
      ringtoneRef.current = setInterval(playBeep, 3000);
    } else if (callRequests.length === 0 && ringtoneRef.current) {
      clearInterval(ringtoneRef.current);
      ringtoneRef.current = null;
    }
    return () => { if (ringtoneRef.current) { clearInterval(ringtoneRef.current); ringtoneRef.current = null; } };
  }, [callRequests.length, isRelevant]);

  // Poll call window close
  useEffect(() => {
    if (!activeCallWindow) return;
    const interval = setInterval(() => {
      if (activeCallWindow.win.closed) {
        supabase.from("video_call_requests").update({ status: "ended" } as any).eq("id", activeCallWindow.requestId).then(() => {});
        setActiveCallWindow(null);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [activeCallWindow]);

  // Fetch pending calls + listen for new ones
  useEffect(() => {
    if (!isRelevant || !user) return;

    const fetchPending = async () => {
      // Artisans see customer-initiated calls; Customers see artisan-initiated calls
      let query = supabase
        .from("video_call_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (isArtisan) {
        query = query.eq("artisan_id", user.id).eq("initiated_by", "customer");
      } else {
        query = query.eq("customer_id", user.id).eq("initiated_by", "artisan");
      }

      const { data } = await query;
      if (data && data.length > 0) {
        const otherIds = [...new Set(data.map((r: any) => isArtisan ? r.customer_id : r.artisan_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", otherIds);
        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
        setCallRequests(data.map((r: any) => ({
          ...r,
          caller_name: profileMap.get(isArtisan ? r.customer_id : r.artisan_id)?.full_name || (isArtisan ? "Customer" : "Artisan"),
        })));
      }
    };
    fetchPending();

    // Listen for new incoming calls
    const filterCol = isArtisan ? "artisan_id" : "customer_id";
    const channel = supabase
      .channel('global-incoming-calls')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'video_call_requests',
        filter: `${filterCol}=eq.${user.id}`,
      }, async (payload) => {
        const req = payload.new as any;
        // Only show if the OTHER party initiated
        if (isArtisan && req.initiated_by !== 'customer') return;
        if (isCustomer && req.initiated_by !== 'artisan') return;

        const otherId = isArtisan ? req.customer_id : req.artisan_id;
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").eq("user_id", otherId).limit(1);
        const name = profiles?.[0]?.full_name || (isArtisan ? "Customer" : "Artisan");
        setCallRequests((prev) => [{ ...req, caller_name: name }, ...prev]);
        toast({ title: "📞 Incoming Call!", description: `${name} wants to video call you.` });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isRelevant, user?.id, isArtisan, isCustomer]);

  const respondToCall = async (requestId: string, accept: boolean) => {
    const status = accept ? "accepted" : "declined";
    // Both artisans and customers need to update - use the appropriate policy
    await supabase.from("video_call_requests").update({
      status,
      responded_at: new Date().toISOString(),
    } as any).eq("id", requestId);

    const req = callRequests.find((r) => r.id === requestId);
    setCallRequests((prev) => prev.filter((r) => r.id !== requestId));
    if (accept && req?.room_url) {
      toast({ title: "Call accepted! Joining..." });
      const win = window.open(req.room_url, "_blank");
      if (win) setActiveCallWindow({ win, requestId });
    } else if (!accept) {
      toast({ title: "Call declined" });
    }
  };

  if (!isRelevant || callRequests.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 right-6 z-[100] space-y-3 max-w-sm w-full">
        {callRequests.map((req) => (
          <motion.div
            key={req.id}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40 }}
            className="bg-card border-2 border-primary rounded-xl p-4 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <PhoneIncoming className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Incoming Video Call</p>
                <p className="text-xs text-muted-foreground truncate">
                  {req.caller_name} · {new Date(req.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => respondToCall(req.id, true)}>
                <Check className="h-4 w-4 mr-1" /> Accept
              </Button>
              <Button size="sm" variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => respondToCall(req.id, false)}>
                <X className="h-4 w-4 mr-1" /> Decline
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
};

export default GlobalCallNotification;
