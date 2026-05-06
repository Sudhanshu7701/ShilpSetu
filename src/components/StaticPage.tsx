import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface StaticPageProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const StaticPage = ({ title, subtitle, children }: StaticPageProps) => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2 text-lg">{subtitle}</p>}
          <div className="mt-10 prose prose-neutral max-w-none text-muted-foreground [&_h2]:font-display [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:leading-relaxed [&_ul]:space-y-2 [&_li]:text-sm">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
    <Footer />
  </div>
);

export default StaticPage;
