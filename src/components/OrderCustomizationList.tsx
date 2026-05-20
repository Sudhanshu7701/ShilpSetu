import type { SelectedCustomization } from "./CustomizationPicker";

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

interface Props {
  customizations: SelectedCustomization[] | null | undefined;
  basePrice?: number | null;
  quantity?: number | null;
  totalAmount?: number | null;
}

const OrderCustomizationList = ({ customizations, basePrice, quantity, totalAmount }: Props) => {
  const items = customizations || [];
  if (items.length === 0 && !basePrice) return null;

  const extraTotal = items.reduce((sum, c) => sum + (c.price || 0), 0);

  return (
    <div className="bg-muted/40 rounded-lg border border-border p-3 text-xs space-y-2">
      <p className="font-medium text-foreground text-[11px] uppercase tracking-wider">Customization Details</p>
      {basePrice !== undefined && basePrice !== null && (
        <div className="flex justify-between text-muted-foreground">
          <span>Base Price</span>
          <span className="text-foreground font-medium">{formatINR(basePrice)}</span>
        </div>
      )}
      {items.map((c, i) => (
        <div key={i} className="flex justify-between">
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">{c.group}:</span> {c.label}
          </span>
          {c.price > 0 && <span className="text-foreground font-medium">+{formatINR(c.price)}</span>}
        </div>
      ))}
      {extraTotal > 0 && (
        <div className="flex justify-between border-t border-border pt-1.5 mt-1">
          <span className="text-muted-foreground">Customization Add-ons</span>
          <span className="text-secondary font-medium">+{formatINR(extraTotal)}</span>
        </div>
      )}
      {quantity !== undefined && quantity !== null && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Quantity</span>
          <span className="text-foreground font-medium">× {quantity}</span>
        </div>
      )}
      {totalAmount !== undefined && totalAmount !== null && (
        <div className="flex justify-between border-t border-border pt-1.5 mt-1">
          <span className="text-foreground font-semibold">Order Total</span>
          <span className="text-foreground font-bold">{formatINR(totalAmount)}</span>
        </div>
      )}
    </div>
  );
};

export default OrderCustomizationList;
