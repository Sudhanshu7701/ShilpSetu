import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

interface EmailPayload {
  type: "order_confirmation" | "status_update";
  to_email: string;
  customer_name: string;
  product_title: string;
  order_id: string;
  amount?: number;
  quantity?: number;
  new_status?: string;
  artisan_name?: string;
}

const stageLabels: Record<string, string> = {
  placed: "Order Placed",
  design: "Design Phase",
  weaving: "Weaving in Progress",
  finishing: "Finishing Touches",
  quality_check: "Quality Check",
  dispatch: "Dispatched",
  delivered: "Delivered",
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

function buildOrderConfirmationHtml(data: EmailPayload): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:24px;font-weight:700;color:#6B1D2A;letter-spacing:1px;">LOOM</span><span style="font-size:24px;font-weight:700;color:#B8860B;">LIVE</span>
    </div>
    <div style="background:#FDF8F4;border-radius:12px;padding:32px;border:1px solid #E8DDD3;">
      <h1 style="margin:0 0 8px;font-size:20px;color:#1a1a1a;">Order Confirmed! 🎉</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Thank you for supporting handcrafted artistry, ${data.customer_name}.</p>
      <div style="background:#ffffff;border-radius:8px;padding:16px;margin-bottom:20px;border:1px solid #E8DDD3;">
        <p style="margin:0 0 4px;font-weight:600;color:#1a1a1a;font-size:15px;">${data.product_title}</p>
        ${data.artisan_name ? `<p style="margin:0 0 4px;color:#6b7280;font-size:13px;">By ${data.artisan_name}</p>` : ""}
        <p style="margin:0;color:#6b7280;font-size:13px;">Qty: ${data.quantity || 1} · Total: ${data.amount ? formatINR(data.amount) : "—"}</p>
      </div>
      <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">Order ID: <span style="color:#1a1a1a;font-weight:500;">${data.order_id.slice(0, 8).toUpperCase()}</span></p>
      <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">Your artisan will begin crafting your piece. You can track progress in your dashboard.</p>
    </div>
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#9ca3af;font-size:12px;">LoomLive — Handcrafted with ❤️ from India</p>
    </div>
  </div>
</body>
</html>`;
}

function buildStatusUpdateHtml(data: EmailPayload): string {
  const statusLabel = stageLabels[data.new_status || ""] || data.new_status || "Updated";
  const isDelivered = data.new_status === "delivered";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:24px;font-weight:700;color:#6B1D2A;letter-spacing:1px;">LOOM</span><span style="font-size:24px;font-weight:700;color:#B8860B;">LIVE</span>
    </div>
    <div style="background:#FDF8F4;border-radius:12px;padding:32px;border:1px solid #E8DDD3;">
      <h1 style="margin:0 0 8px;font-size:20px;color:#1a1a1a;">${isDelivered ? "Your Order Has Arrived! 🎁" : "Order Status Update"}</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Hi ${data.customer_name}, here's an update on your order.</p>
      <div style="background:#ffffff;border-radius:8px;padding:16px;margin-bottom:20px;border:1px solid #E8DDD3;">
        <p style="margin:0 0 4px;font-weight:600;color:#1a1a1a;font-size:15px;">${data.product_title}</p>
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Order: ${data.order_id.slice(0, 8).toUpperCase()}</p>
        <div style="display:inline-block;background:${isDelivered ? "#16a34a" : "#B8860B"};color:#ffffff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">
          ${statusLabel}
        </div>
      </div>
      ${isDelivered ? '<p style="margin:0;color:#6b7280;font-size:13px;">We hope you love your handcrafted piece! Please consider leaving a review.</p>' : '<p style="margin:0;color:#6b7280;font-size:13px;">Your artisan is making progress on your order. Track it in your dashboard.</p>'}
    </div>
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#9ca3af;font-size:12px;">LoomLive — Handcrafted with ❤️ from India</p>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();

    if (!payload.to_email || !payload.type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subject =
      payload.type === "order_confirmation"
        ? `Order Confirmed — ${payload.product_title}`
        : `Order Update: ${stageLabels[payload.new_status || ""] || "Status Changed"} — ${payload.product_title}`;

    const html =
      payload.type === "order_confirmation"
        ? buildOrderConfirmationHtml(payload)
        : buildStatusUpdateHtml(payload);

    let res: Response;
    try {
      res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "LoomLive <onboarding@resend.dev>",
          to: [payload.to_email],
          subject,
          html,
        }),
      });
    } catch (fetchErr) {
      console.warn("Email fetch failed (non-blocking):", fetchErr);
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "fetch_error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resBody = await res.text();
    if (!res.ok) {
      console.warn("Resend error (non-blocking):", resBody);
      // Return 200 so the client doesn't treat sandbox restrictions as failures
      return new Response(JSON.stringify({ success: true, skipped: true, reason: resBody }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Email function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
