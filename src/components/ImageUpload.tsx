import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, RefreshCw, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  userId: string;
  onUpload: (urls: string[]) => void;
  existingImages?: string[];
  maxImages?: number;
}

const ImageUpload = ({ userId, onUpload, existingImages = [], maxImages = 5 }: ImageUploadProps) => {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setImages(existingImages);
  }, [existingImages]);

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
      return null;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast({ variant: "destructive", title: "Max images reached" });
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const url = await uploadFile(files[i]);
      if (url) newUrls.push(url);
    }

    const updated = [...images, ...newUrls];
    setImages(updated);
    onUpload(updated);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replacingIndex === null) return;

    setUploading(true);
    const url = await uploadFile(file);
    if (url) {
      const updated = [...images];
      updated[replacingIndex] = url;
      setImages(updated);
      onUpload(updated);
      toast({ title: "Image replaced!" });
    }
    setReplacingIndex(null);
    setUploading(false);
    if (replaceRef.current) replaceRef.current.value = "";
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    onUpload(updated);
  };

  const startReplace = (index: number) => {
    setReplacingIndex(index);
    setTimeout(() => replaceRef.current?.click(), 0);
  };

  // Drag reorder
  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...images];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setImages(updated);
    onUpload(updated);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {images.length}/{maxImages} images {images.length > 1 && "· drag to reorder"}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((url, i) => (
          <div
            key={`${url}-${i}`}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing group ${
              dragOverIndex === i ? "border-primary scale-105" : i === 0 ? "border-primary/50" : "border-border"
            }`}
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[9px] font-bold text-center py-0.5">
                COVER
              </span>
            )}
            {/* Drag handle hint */}
            <div className="absolute top-1 left-1 p-0.5 rounded bg-background/60 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-3 w-3" />
            </div>
            {/* Action buttons */}
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => startReplace(i)}
                className="p-1 rounded-full bg-background/80 text-muted-foreground hover:text-primary transition-colors"
                title="Replace image"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="p-1 rounded-full bg-destructive text-destructive-foreground"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            <span className="text-[10px] mt-1">{uploading ? "Uploading..." : "Add"}</span>
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
      <input ref={replaceRef} type="file" accept="image/*" onChange={handleReplace} className="hidden" />
    </div>
  );
};

export default ImageUpload;
