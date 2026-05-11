import { supabase } from "@/integrations/supabase/client";

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
}

export const createNotification = async ({ userId, type, title, message, link }: CreateNotificationParams) => {
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message: message || null,
    link: link || null,
  } as any);
};

// Send email notification via edge function (fire-and-forget)
const sendEmail = async (payload: Record<string, any>) => {
  try {
    await supabase.functions.invoke("send-order-email", { body: payload });
  } catch (err) {
    console.warn("Email notification failed (non-blocking):", err);
  }
};

export const notifyOrderPlaced = async (
  artisanId: string,
  productTitle: string,
  customerName: string,
  orderId: string,
  customerEmail?: string,
  amount?: number,
  quantity?: number,
  artisanName?: string,
) => {
  // In-app notification for artisan
  await createNotification({
    userId: artisanId,
    type: "order_placed",
    title: "New Order Received! 🎉",
    message: `${customerName} ordered "${productTitle}"`,
    link: "/dashboard/artisan",
  });

  // Email confirmation to customer
  if (customerEmail) {
    sendEmail({
      type: "order_confirmation",
      to_email: customerEmail,
      customer_name: customerName,
      product_title: productTitle,
      order_id: orderId,
      amount,
      quantity,
      artisan_name: artisanName,
    });
  }
};

export const notifyOrderStatusUpdate = async (
  customerId: string,
  productTitle: string,
  newStatus: string,
  orderId: string,
  customerEmail?: string,
  customerName?: string,
) => {
  const stageLabels: Record<string, string> = {
    placed: "Placed", design: "Design", weaving: "Weaving", finishing: "Finishing",
    quality_check: "Quality Check", dispatch: "Dispatched", delivered: "Delivered",
  };
  const statusLabel = stageLabels[newStatus] || newStatus;

  // In-app notification for customer
  await createNotification({
    userId: customerId,
    type: "order_status",
    title: `Order Update: ${statusLabel}`,
    message: `Your order for "${productTitle}" is now in ${statusLabel} stage`,
    link: "/dashboard",
  });

  // Email notification to customer
  if (customerEmail) {
    sendEmail({
      type: "status_update",
      to_email: customerEmail,
      customer_name: customerName || "Customer",
      product_title: productTitle,
      order_id: orderId,
      new_status: newStatus,
    });
  }
};
