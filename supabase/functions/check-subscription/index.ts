import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Map Stripe product IDs to our tier names
const PRODUCT_TIER_MAP: Record<string, string> = {
  "prod_U7369KBCcBeSKR": "normal",
  "prod_U737NXc2aojf4B": "premium",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      // No Stripe customer → free tier, update DB
      await supabaseClient.from("subscriptions").upsert(
        { user_id: user.id, tier: "free", updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
      return new Response(JSON.stringify({ subscribed: false, tier: "free" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });

    if (subscriptions.data.length === 0) {
      await supabaseClient.from("subscriptions").upsert(
        { user_id: user.id, tier: "free", updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
      return new Response(JSON.stringify({ subscribed: false, tier: "free" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sub = subscriptions.data[0];
    const productId = sub.items.data[0].price.product as string;
    const tier = PRODUCT_TIER_MAP[productId] || "free";
    const subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();

    // Sync to our DB
    await supabaseClient.from("subscriptions").upsert(
      {
        user_id: user.id,
        tier,
        started_at: new Date(sub.current_period_start * 1000).toISOString(),
        expires_at: subscriptionEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    return new Response(JSON.stringify({ subscribed: true, tier, subscription_end: subscriptionEnd }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
