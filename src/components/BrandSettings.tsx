import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Upload, Loader2, Palette } from "lucide-react";

const BrandSettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [brandName, setBrandName] = useState((profile as any)?.brand_name || "");
  const [brandTagline, setBrandTagline] = useState((profile as any)?.brand_tagline || "");
  const [brandColor, setBrandColor] = useState((profile as any)?.brand_color || "#8B5E3C");
  const [brandLogo, setBrandLogo] = useState<string | null>((profile as any)?.brand_logo_url || null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/brand-logo.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } else {
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setBrandLogo(data.publicUrl);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      brand_name: brandName || null,
      brand_tagline: brandTagline || null,
      brand_color: brandColor,
      brand_logo_url: brandLogo,
    } as any).eq("user_id", user.id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Brand updated! 🎨" });
      await refreshProfile();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Palette className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-bold text-foreground">Your Brand Identity</h3>
      </div>

      {/* Brand Preview */}
      <div
        className="rounded-xl p-6 border-2 transition-colors"
        style={{ borderColor: brandColor, background: `${brandColor}10` }}
      >
        <div className="flex items-center gap-4">
          {brandLogo ? (
            <img src={brandLogo} alt="Brand logo" className="w-16 h-16 rounded-lg object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">Logo</div>
          )}
          <div>
            <h4 className="font-display text-xl font-bold" style={{ color: brandColor }}>
              {brandName || "Your Brand Name"}
            </h4>
            <p className="text-sm text-muted-foreground italic">
              {brandTagline || "Your tagline here…"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Brand Name</Label>
          <Input
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g. LaxmiLoom"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Tagline</Label>
          <Input
            value={brandTagline}
            onChange={(e) => setBrandTagline(e.target.value)}
            placeholder="e.g. Weaving dreams since 1950"
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex items-end gap-4">
        <div>
          <Label>Brand Color</Label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border border-border"
            />
            <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="w-28 text-xs" />
          </div>
        </div>

        <div>
          <Label>Brand Logo</Label>
          <div className="mt-1">
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm text-foreground hover:bg-muted/80 transition-colors">
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading…" : "Upload Logo"}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save Brand Settings
      </Button>
    </div>
  );
};

export default BrandSettings;
