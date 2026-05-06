import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VoiceSearchProps {
  onResult: (transcript: string) => void;
  lang?: string;
}

const LANGUAGES = [
  { code: "hi-IN", label: "हिंदी" },
  { code: "en-IN", label: "English" },
  { code: "bn-IN", label: "বাংলা" },
  { code: "ta-IN", label: "தமிழ்" },
  { code: "te-IN", label: "తెలుగు" },
  { code: "mr-IN", label: "मराठी" },
  { code: "gu-IN", label: "ગુજરાતી" },
  { code: "kn-IN", label: "ಕನ್ನಡ" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ" },
];

const VoiceSearch = ({ onResult, lang = "hi-IN" }: VoiceSearchProps) => {
  const [listening, setListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState(lang);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const isSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast({ variant: "destructive", title: "Voice search not supported", description: "Please use Chrome or Edge for voice search." });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setListening(false);
      toast({ title: `🎤 "${transcript}"` });
    };

    recognition.onerror = (event: any) => {
      setListening(false);
      if (event.error === "not-allowed") {
        toast({ variant: "destructive", title: "Microphone access denied", description: "Please enable microphone permissions." });
      }
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [isSupported, selectedLang, onResult, toast]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  if (!isSupported) return null;

  return (
    <div className="relative flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant={listening ? "default" : "outline"}
              className={`shrink-0 ${listening ? "bg-destructive text-destructive-foreground animate-pulse" : "border-border text-muted-foreground hover:text-foreground"}`}
              onClick={listening ? stopListening : startListening}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{listening ? "Stop listening" : "Voice search"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="text-[10px] px-1.5 h-7 text-muted-foreground hover:text-foreground"
        onClick={() => setShowLangPicker(!showLangPicker)}
      >
        {LANGUAGES.find((l) => l.code === selectedLang)?.label || "हिंदी"}
      </Button>

      {showLangPicker && (
        <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 p-1 min-w-[120px]">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setSelectedLang(l.code); setShowLangPicker(false); }}
              className={`block w-full text-left text-xs px-3 py-1.5 rounded hover:bg-muted transition-colors ${selectedLang === l.code ? "text-primary font-medium" : "text-foreground"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceSearch;
