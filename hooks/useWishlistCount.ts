import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useWishlistCount = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) { setCount(0); return; }

    const fetch = async () => {
      const { count: c } = await supabase
        .from("wishlists")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setCount(c || 0);
    };

    fetch();

    const channel = supabase
      .channel("wishlist-count")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "wishlists",
        filter: `user_id=eq.${user.id}`,
      }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return count;
};
