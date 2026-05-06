import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { notifyOrderPlaced } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { X, Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { useState } from "react";

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const CartDrawer = () => {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalAmount, isOpen, setIsOpen } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      toast({ title: "Please sign in to checkout" });
      navigate("/auth");
      setIsOpen(false);
      return;
    }
    if (items.length === 0) return;

    setChecking(true);
    try {
      // Create orders for each item
      const orderInserts = items.map((item) => ({
        customer_id: user.id,
        product_id: item.id,
        artisan_id: item.artisan_id,
        quantity: item.quantity,
        total_amount: item.price * item.quantity,
      }));

      const { error: orderError } = await supabase.from("orders").insert(orderInserts);
      if (orderError) throw orderError;

      // Notify each artisan + send confirmation emails
      for (const item of items) {
        notifyOrderPlaced(
          item.artisan_id, item.title, user.email || "Customer", item.id,
          user.email || undefined, item.price * item.quantity, item.quantity, item.artisan_name
        );
      }

      // Create Stripe checkout with all items
      const { data: checkoutData, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          items: items.map((item) => ({
            product_title: item.title,
            amount: item.price,
            quantity: item.quantity,
            product_id: item.id,
            artisan_id: item.artisan_id,
          })),
          customer_email: user.email,
        },
      });

      if (error) throw error;

      if (checkoutData?.url) {
        clearCart();
        setIsOpen(false);
        window.open(checkoutData.url, '_blank');
        toast({ title: "Redirecting to payment…", description: "A new tab has been opened for checkout." });
      } else {
        clearCart();
        toast({ title: "Orders placed! 🎉" });
        setIsOpen(false);
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Checkout failed", description: err.message });
    }
    setChecking(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-bold text-foreground">
                  Your Cart ({totalItems})
                </h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-display text-lg text-foreground">Cart is empty</p>
                  <p className="text-sm text-muted-foreground mt-1">Add some handcrafted treasures!</p>
                  <Button className="mt-4 bg-primary text-primary-foreground" onClick={() => { setIsOpen(false); navigate("/shop"); }}>
                    Browse Shop
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="flex gap-3 bg-card rounded-lg p-3 border border-border"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-20 h-20 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm line-clamp-2">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.artisan_name} · {item.region}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-border rounded-md">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 text-xs font-medium text-foreground">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.max_quantity}
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-foreground">{formatINR(item.price * item.quantity)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-muted-foreground hover:text-destructive self-start shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-xl font-display font-bold text-foreground">{formatINR(totalAmount)}</span>
                </div>
                <Button
                  onClick={handleCheckout}
                  disabled={checking}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-5 text-base"
                >
                  {checking && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {checking ? "Processing..." : `Checkout · ${formatINR(totalAmount)}`}
                </Button>
                <button
                  onClick={clearCart}
                  className="w-full text-sm text-muted-foreground hover:text-foreground text-center"
                >
                  Clear Cart
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
