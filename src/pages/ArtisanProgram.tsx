import StaticPage from "@/components/StaticPage";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ArtisanProgram = () => (
  <StaticPage title="Artisan Program" subtitle="Join India's premier marketplace for handcrafted goods.">
    <h2>Why Join LOOMLIVE?</h2>
    <ul>
      <li><strong>Direct Sales:</strong> Sell directly to customers with zero middlemen.</li>
      <li><strong>Fair Pricing:</strong> You set your own prices and keep the majority of every sale.</li>
      <li><strong>Live Events:</strong> Host live craft sessions to showcase your skills and sell in real-time.</li>
      <li><strong>Growth Support:</strong> We help with photography, product listings, and marketing.</li>
    </ul>
    <h2>Who Can Join?</h2>
    <p>Any artisan practising traditional Indian crafts — weaving, pottery, painting, embroidery, metalwork, woodwork, and more. GI-registered artisans are especially welcome.</p>
    <h2>How to Apply</h2>
    <p>Sign up as an artisan on LOOMLIVE and start listing your products today.</p>
    <div className="mt-6 not-prose">
      <Link to="/auth">
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Sign Up as Artisan</Button>
      </Link>
    </div>
  </StaticPage>
);

export default ArtisanProgram;
