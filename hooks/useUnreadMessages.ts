import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }

    const fetchUnread = async () => {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);
      setUnreadCount(count || 0);
    };

    fetchUnread();

    // Realtime: listen for new messages or read status updates
    const channel = supabase
      .channel("unread-messages")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        fetchUnread();
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `sender_id=eq.${user.id}`,
      }, () => {
        // Refresh when user sends a message (to stay in sync)
        fetchUnread();
      })
      .subscribe();

    // Polling fallback every 15s
    const interval = setInterval(fetchUnread, 15000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user]);

  return unreadCount;
};
