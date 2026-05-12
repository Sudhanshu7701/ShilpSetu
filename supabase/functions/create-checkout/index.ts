import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2025-08-27.basil' });
    const body = await req.json();

    // Support both single-item (legacy) and multi-item cart checkout
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
    let metadata: Record<string, string> = {};

    if (body.items && Array.isArray(body.items)) {
      // Multi-item cart checkout
      lineItems = body.items.map((item: any) => ({
        price_data: {
          currency: 'inr',
          product_data: { name: item.product_title },
          unit_amount: Math.round(item.amount * 100),
        },
        quantity: item.quantity || 1,
      }));
      metadata = {
        item_count: String(body.items.length),
        product_ids: body.items.map((i: any) => i.product_id).join(','),
      };
    } else {
      // Single item (legacy Buy Now)
      const { product_title, amount, quantity, product_id, artisan_id } = body;
      if (!product_title || !amount || !product_id || !artisan_id) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      lineItems = [{
        price_data: {
          currency: 'inr',
          product_data: { name: product_title },
          unit_amount: Math.round(amount * 100),
        },
        quantity: quantity || 1,
      }];
      metadata = { product_id, artisan_id, quantity: String(quantity || 1) };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: body.customer_email || undefined,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/dashboard?payment=success`,
      cancel_url: `${req.headers.get('origin')}/shop?payment=cancelled`,
      metadata,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
