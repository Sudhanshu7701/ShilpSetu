import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { user_id, browsing_context } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Fetch all products
    const { data: products } = await sb.from("products").select("id, title, category, region, price, rarity_tier, rating, quantity, images").order("created_at", { ascending: false }).limit(100);

    // Fetch user's order history and wishlist if logged in
    let userContext = "";
    if (user_id) {
      const [{ data: orders }, { data: wishlist }] = await Promise.all([
        sb.from("orders").select("product_id, products(title, category, region)").eq("customer_id", user_id).limit(20),
        sb.from("wishlists").select("product_id, products(title, category, region)").eq("user_id", user_id).limit(20),
      ]);
      const orderedItems = orders?.map((o: any) => `${o.products?.title} (${o.products?.category}, ${o.products?.region})`).join(", ") || "none";
      const wishlistItems = wishlist?.map((w: any) => `${w.products?.title} (${w.products?.category}, ${w.products?.region})`).join(", ") || "none";
      userContext = `\nUser's past orders: ${orderedItems}\nUser's wishlist: ${wishlistItems}`;
    }

    const productList = products?.map((p: any) => `ID:${p.id}|${p.title}|${p.category}|${p.region}|₹${p.price}|${p.rarity_tier}|rating:${p.rating}|stock:${p.quantity}`).join("\n") || "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a product recommendation AI for an Indian artisan marketplace. Match users with rare, authentic regional products. Prioritize rare/ultra_rare items and niche regional crafts. Return exactly 6 product IDs that best match the user's interests.`,
          },
          {
            role: "user",
            content: `Available products:\n${productList}\n${userContext}\n${browsing_context ? `Current browsing context: ${browsing_context}` : "User just arrived, recommend diverse rare finds."}\n\nReturn the 6 best matching product IDs.`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "recommend_products",
            description: "Return recommended product IDs with reasons",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      product_id: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["product_id", "reason"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["recommendations"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "recommend_products" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let recommendations = [];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      recommendations = parsed.recommendations || [];
    }

    // Fetch full product data for recommended IDs
    const recIds = recommendations.map((r: any) => r.product_id).filter(Boolean);
    let matchedProducts: any[] = [];

    if (recIds.length > 0) {
      const { data: recProducts } = await sb.from("products").select("*").in("id", recIds);
      if (recProducts) {
        // Get artisan names
        const artisanIds = [...new Set(recProducts.map((p: any) => p.artisan_id))];
        const { data: profiles } = await sb.from("profiles").select("user_id, full_name, is_verified").in("user_id", artisanIds);
        const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

        matchedProducts = recProducts.map((p: any) => ({
          ...p,
          artisan_name: profileMap.get(p.artisan_id)?.full_name || "Artisan",
          artisan_verified: profileMap.get(p.artisan_id)?.is_verified || false,
          match_reason: recommendations.find((r: any) => r.product_id === p.id)?.reason || "",
        }));
      }
    }

    return new Response(JSON.stringify({ recommendations: matchedProducts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI match error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
