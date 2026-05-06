import { Link } from "react-router-dom";

const footerLinks = [
  {
    title: "Discover",
    links: [
      { label: "All Crafts", href: "/shop" },
      { label: "Artisans", href: "/#artisans" },
      { label: "Live Events", href: "/live-events" },
      { label: "New Arrivals", href: "/shop" },
      { label: "Craft Heritage", href: "/#heritage" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help-center" },
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "Authenticity", href: "/authenticity" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our Story", href: "/our-story" },
      { label: "Artisan Program", href: "/artisan-program" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-4 gap-8 sm:gap-10">
          <div className="col-span-2 sm:col-span-1 md:col-span-1">
            <Link to="/" className="font-display text-2xl font-bold">
              LOOM<span className="text-secondary">LIVE</span>
            </Link>
            <p className="text-primary-foreground/60 text-sm mt-3 leading-relaxed">
              Connecting India's finest artisans directly with you. Every purchase celebrates a living tradition.
            </p>
          </div>

          {footerLinks.map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link) => {
                  const isHash = link.href.includes("#");
                  return (
                    <li key={link.label}>
                      {isHash ? (
                        <a href={link.href} className="text-sm text-primary-foreground/50 hover:text-secondary transition-colors py-1 inline-flex items-center min-h-[44px]">
                          {link.label}
                        </a>
                      ) : (
                        <Link to={link.href} className="text-sm text-primary-foreground/50 hover:text-secondary transition-colors py-1 inline-flex items-center min-h-[44px]">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-6 text-center text-xs text-primary-foreground/40">
          © 2026 LOOMLIVE. Celebrating Indian craftsmanship.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
