import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck, Upload, Loader2, FileText, Clock, CheckCircle, XCircle, AlertTriangle,
} from "lucide-react";

interface VerificationRequest {
  id: string;
  status: string;
  document_type: string;
  document_url: string;
  admin_notes: string | null;
  created_at: string;
}

const VerificationBanner = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) fetchRequest();
  }, [user]);

  const fetchRequest = async () => {
    const { data } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("artisan_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setRequest(data as VerificationRequest | null);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);

    try {
      const ext = selectedFile.name.split(".").pop();
      const path = `${user.id}/aadhaar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("verification-docs")
        .upload(path, selectedFile, { upsert: true });
      if (uploadError) throw uploadError;

      // Store the path reference (admins will access via signed URL)
      const { error: insertError } = await supabase
        .from("verification_requests")
        .insert({
          artisan_id: user.id,
          document_type: "aadhaar",
          document_url: path,
        } as any);
      if (insertError) throw insertError;

      toast({ title: "Verification submitted! 📋", description: "Our team will review your documents within 24-48 hours." });
      setSelectedFile(null);
      fetchRequest();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setUploading(false);
  };

  if (loading) return null;

  // Already verified
  if (profile?.is_verified) {
    return (
      <div className="mb-6 p-4 rounded-lg bg-secondary/10 border border-secondary/30 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-secondary shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Identity Verified ✓</p>
          <p className="text-xs text-muted-foreground">Your identity has been verified. You have full access to all artisan features.</p>
        </div>
        <Badge className="bg-secondary/20 text-secondary border-0 text-xs ml-auto shrink-0">
          <ShieldCheck className="h-3 w-3 mr-1" /> Certified
        </Badge>
      </div>
    );
  }

  // Pending review
  if (request?.status === "pending") {
    return (
      <div className="mb-6 p-4 rounded-lg bg-accent/10 border border-accent/30 flex items-start gap-3">
        <Clock className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Verification Under Review</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your Aadhaar document has been submitted and is being reviewed by our team. This usually takes 24-48 hours.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Submitted: {new Date(request.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <Badge className="bg-accent/20 text-accent border-0 text-xs ml-auto shrink-0">
          <Clock className="h-3 w-3 mr-1" /> Pending
        </Badge>
      </div>
    );
  }

  // Rejected — allow resubmission
  if (request?.status === "rejected") {
    return (
      <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
        <div className="flex items-start gap-3 mb-3">
          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Verification Rejected</p>
            <p className="text-xs text-muted-foreground mt-1">
              {request.admin_notes || "Your document could not be verified. Please resubmit a clear photo of your Aadhaar card."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <Label htmlFor="resubmit-doc" className="cursor-pointer">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-background text-sm text-foreground hover:bg-muted transition-colors">
              <Upload className="h-4 w-4" />
              {selectedFile ? selectedFile.name : "Upload Aadhaar Card"}
            </div>
          </Label>
          <input id="resubmit-doc" type="file" accept="image/*,.pdf" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="hidden" />
          {selectedFile && (
            <Button size="sm" onClick={handleSubmit} disabled={uploading} className="bg-primary text-primary-foreground">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
              Resubmit
            </Button>
          )}
        </div>
      </div>
    );
  }

  // No request — show upload form
  return (
    <div className="mb-6 p-5 rounded-lg bg-primary/5 border border-primary/20">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">Verify Your Identity</p>
          <p className="text-xs text-muted-foreground mt-1">
            To get the certified badge, add products, and start selling — please verify your identity by uploading your Aadhaar card. 
            Your document is stored securely and only accessible by our verification team.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Label htmlFor="verification-doc" className="cursor-pointer">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-md border border-border bg-background text-sm text-foreground hover:bg-muted transition-colors">
            <FileText className="h-4 w-4" />
            {selectedFile ? selectedFile.name : "Upload Aadhaar Card (Image or PDF)"}
          </div>
        </Label>
        <input id="verification-doc" type="file" accept="image/*,.pdf" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="hidden" />
        {selectedFile && (
          <Button onClick={handleSubmit} disabled={uploading} className="bg-primary text-primary-foreground min-h-[44px]">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Submit for Verification
          </Button>
        )}
      </div>
    </div>
  );
};

export default VerificationBanner;
