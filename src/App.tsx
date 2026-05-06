import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import CartDrawer from "@/components/CartDrawer";
import GlobalCallNotification from "@/components/GlobalCallNotification";
import Index from "./pages/Index";

// Lazy-loaded routes for code splitting
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const ArtisanProfile = lazy(() => import("./pages/ArtisanProfile"));
const ArtisanDashboard = lazy(() => import("./pages/ArtisanDashboard"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const Shop = lazy(() => import("./pages/Shop"));
const Messages = lazy(() => import("./pages/Messages"));
const LiveEvents = lazy(() => import("./pages/LiveEvents"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Returns = lazy(() => import("./pages/Returns"));
const Authenticity = lazy(() => import("./pages/Authenticity"));
const Contact = lazy(() => import("./pages/Contact"));
const OurStory = lazy(() => import("./pages/OurStory"));
const ArtisanProgram = lazy(() => import("./pages/ArtisanProgram"));
const BlogPage = lazy(() => import("./pages/Blog"));
const Careers = lazy(() => import("./pages/Careers"));
const PressPage = lazy(() => import("./pages/Press"));
const SubscriptionPlans = lazy(() => import("./pages/SubscriptionPlans"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-muted-foreground font-medium">Loading…</span>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
        <AuthProvider>
          <SubscriptionProvider>
          <CartProvider>
          <CartDrawer />
          <GlobalCallNotification />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/artisan/:id" element={<ArtisanProfile />} />
              <Route path="/dashboard/artisan" element={<ArtisanDashboard />} />
              <Route path="/dashboard" element={<CustomerDashboard />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/live-events" element={<LiveEvents />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/authenticity" element={<Authenticity />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/our-story" element={<OurStory />} />
              <Route path="/artisan-program" element={<ArtisanProgram />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/press" element={<PressPage />} />
              <Route path="/plans" element={<SubscriptionPlans />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </CartProvider>
          </SubscriptionProvider>
        </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
