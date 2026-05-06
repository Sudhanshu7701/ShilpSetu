import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, LANGUAGES, LanguageCode } from "@/contexts/LanguageContext";

interface Props {
  variant?: "icon" | "full";
}

const LanguagePicker = ({ variant = "icon" }: Props) => {
  const { language, setLanguage } = useLanguage();
  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground notranslate"
            aria-label="Select language"
            title={`Language: ${current.native}`}
          >
            <Globe className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="notranslate gap-2">
            <Globe className="h-4 w-4" />
            {current.native}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 notranslate max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel>Choose Language / भाषा चुनें</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code as LanguageCode)}
            className="cursor-pointer flex items-center justify-between"
          >
            <span>
              <span className="font-medium">{lang.native}</span>
              {lang.code !== "en" && (
                <span className="text-xs text-muted-foreground ml-2">{lang.label}</span>
              )}
            </span>
            {language === lang.code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguagePicker;
