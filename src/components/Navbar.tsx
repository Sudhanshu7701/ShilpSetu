import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, Heart, ShoppingBag, User, MessageCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useWishlistCount } from "@/hooks/useWishlistCount";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";
import LanguagePicker from "@/components/LanguagePicker";

const navLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Live Events", href: "/live-events" },
  { label: "Artisans", href: "/#artisans" },
  { label: "Craft Heritage", href: "/#heritage" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut, role } = useAuth();
  const { totalItems, setIsOpen: openCart } = useCart();
  const unreadCount = useUnreadMessages();
  const wishlistCount = useWishlistCount();
  const location = useLocation();

  const renderNavLink = (link: { label: string; href: string }, onClick?: () => void) => {
    const isHash = link.href.includes("#");
    const isOnHome = location.pathname === "/";

    // Hash links on the homepage: use native anchor for smooth scroll
    // Hash links on other pages: use native anchor for full navigation + scroll
    if (isHash) {
      const scrollTarget = link.href.replace("/", "");
      return (
        <a
          key={link.label}
          href={isOnHome ? scrollTarget : link.href}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          onClick={onClick}
        >
          {link.label}
        </a>
      );
    }

    return (
      <Link
        key={link.label}
        to={link.href}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={onClick}
      >
        {link.label}
      </Link>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold tracking-tight text-primary">
            LOOM<span className="text-secondary">LIVE</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => renderNavLink(link))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <LanguagePicker />
          <Link to="/shop">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          <Link to={user ? "/dashboard" : "/auth"}>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
              <Heart className="h-5 w-5" />
              <AnimatePresence>
                {wishlistCount > 0 && (
                  <motion.span
                    key={wishlistCount}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center"
                  >
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative" onClick={() => openCart(true)}>
            <ShoppingBag className="h-5 w-5" />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center"
                >
                  {totalItems > 9 ? "9+" : totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
          {user ? (
            <div className="flex items-center gap-2 ml-2">
              <NotificationBell />
              <Link to="/messages">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                  <MessageCircle className="h-5 w-5" />
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span
                        key={unreadCount}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </Link>
              {role === "admin" && (
                <Link to="/admin">
                  <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                    <ShieldCheck className="h-4 w-4 mr-1" />
                    Admin
                  </Button>
                </Link>
              )}
              {role === "artisan" ? (
                <Link to="/dashboard/artisan">
                  <Button size="sm" variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                    Studio
                  </Button>
                </Link>
              ) : role !== "admin" ? (
                <Link to="/dashboard">
                  <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    Dashboard
                  </Button>
                </Link>
              ) : null}
              <Button size="sm" variant="ghost" onClick={signOut} className="text-muted-foreground hover:text-foreground">
                Sign Out
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="ml-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <User className="h-4 w-4 mr-1" />
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-1 md:hidden">
          <LanguagePicker />
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-10 w-10" onClick={() => openCart(true)}>
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Button>
          <button
            className="text-foreground p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <div key={link.label} className="min-h-[48px] flex items-center">
                  {renderNavLink(link, () => setMobileOpen(false))}
                </div>
              ))}
              <div className="border-t border-border my-2" />
              {user ? (
                <div className="flex flex-col gap-2">
                  <Link to="/messages" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full min-h-[48px] relative">
                      Messages
                      {unreadCount > 0 && (
                        <span className="ml-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Link to={user ? "/dashboard" : "/auth"} onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full min-h-[48px] relative">
                      <Heart className="h-4 w-4 mr-2" />
                      Wishlist
                      {wishlistCount > 0 && (
                        <span className="ml-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                          {wishlistCount > 9 ? "9+" : wishlistCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  {role === "admin" && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full min-h-[48px]">
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  <Link to={role === "artisan" ? "/dashboard/artisan" : "/dashboard"} onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full min-h-[48px]">{role === "artisan" ? "Studio" : "Dashboard"}</Button>
                  </Link>
                  <Button variant="ghost" className="min-h-[48px]" onClick={() => { signOut(); setMobileOpen(false); }}>Sign Out</Button>
                </div>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full min-h-[48px] bg-primary text-primary-foreground">Sign In</Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
