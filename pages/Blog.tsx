import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Tag } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";

const blogPosts = [
  {
    id: "banarasi-silk-weaving-guide",
    title: "The Art of Banarasi Silk Weaving: A Living Heritage of Varanasi",
    excerpt: "Discover how Banarasi silk sarees are handwoven on traditional looms by master artisans in Varanasi. Learn about the centuries-old techniques, gold brocade patterns, and why every Banarasi is a work of art.",
    content: `Banarasi silk sarees are among the finest handwoven textiles in the world. Originating in the holy city of Varanasi (Banaras), these sarees have been crafted for over 600 years by families who pass their weaving skills down through generations.

Each Banarasi saree takes between 15 days to 6 months to complete, depending on the complexity of the design. The most intricate pieces — featuring real gold and silver zari threads — are true collector's items valued at hundreds of thousands of rupees.

**The Weaving Process**

The journey of a Banarasi saree begins with the selection of pure mulberry silk yarn. The warp (lengthwise threads) is set up on large handlooms, often stretching across an entire room. The weft (crosswise threads) carries the design, which is encoded on perforated cards — a system reminiscent of early computing.

Master weavers work the treadles with their feet while throwing the shuttle by hand, creating each row of the fabric one thread at a time. The distinctive brocade patterns — featuring motifs like kalga (mango), bel (vine), jaal (mesh), and butidar (individual motifs) — emerge slowly as thousands of threads interlace.

**Zari Work: The Golden Touch**

What truly distinguishes Banarasi sarees is the zari work. Traditional zari is made by flattening real gold or silver wire and wrapping it around a silk core thread. This metallic thread is then woven into the fabric, creating luminous patterns that catch the light beautifully.

Today at LoomLive, you can watch this entire process unfold in real-time through our live weaving sessions. Our verified artisans in Varanasi stream their work, allowing you to see every golden thread being placed into your saree.

**Why Buy Authentic Banarasi from LoomLive?**

Every Banarasi saree on LoomLive comes with a GI (Geographical Indication) certification, guaranteeing its origin and authenticity. When you buy through Loom Live, you're purchasing directly from the weaver — no middlemen, no markups, just pure craft at fair prices.`,
    category: "Weaving",
    readTime: "6 min read",
    date: "March 5, 2026",
  },
  {
    id: "madhubani-painting-history",
    title: "Madhubani Painting: From Village Walls to Global Art Galleries",
    excerpt: "Explore the vibrant world of Madhubani art from Bihar's Mithila region. Learn how this ancient folk art form, traditionally painted on mud walls, became a globally recognized Indian art style.",
    content: `Madhubani painting, also known as Mithila art, is one of India's most celebrated folk art traditions. Originating in the Mithila region of Bihar, this art form has been practiced for over 2,500 years — with some scholars tracing its origins to the time of the Ramayana.

Traditionally, Madhubani art adorned the walls of homes during festivals and weddings. Women of the household would create elaborate paintings using natural dyes and pigments — turmeric for yellow, indigo for blue, rice paste for white, and lamp soot for black.

**The Five Styles of Madhubani**

Madhubani painting encompasses five distinct styles, each associated with different castes and communities:

1. **Bharni** — Characterized by solid, filled-in colors and bold outlines
2. **Kachni** — Delicate line work creating intricate patterns without solid fills
3. **Tantrik** — Features mystical and tantric symbols with religious significance
4. **Godna** — Inspired by traditional tattoo patterns of the region
5. **Kohbar** — Wedding art depicting fertility symbols and love motifs

**Natural Dyes and Sustainable Art**

What makes Madhubani truly special is its commitment to natural materials. Artists use twigs, matchsticks, and even fingers as brushes. The colors come entirely from nature — flowers, leaves, minerals, and clay. This makes every Madhubani painting an eco-friendly, sustainable work of art.

On LoomLive, we partner with Madhubani artists from Jitwarpur and Ranti villages — the heartland of this art form. Through our platform, these artists share their techniques in live sessions and sell their work directly to art lovers worldwide.

**Bringing Mithila Art to Your Home**

Whether you're looking for a traditional wall painting depicting scenes from Hindu mythology or a contemporary Madhubani piece that blends ancient motifs with modern aesthetics, LoomLive connects you directly with the artists who create them.`,
    category: "Painting",
    readTime: "5 min read",
    date: "February 28, 2026",
  },
  {
    id: "pashmina-kashmir-craft",
    title: "Pashmina: The Diamond Fiber of Kashmir's Highlands",
    excerpt: "Learn about the painstaking journey of Pashmina — from the Changthangi goats of Ladakh to the master weavers of Srinagar. Understand why authentic Pashmina is one of the world's most precious textiles.",
    content: `Pashmina, derived from the Persian word "pashm" meaning wool, is one of the finest natural fibers known to humanity. Each strand of Pashmina wool measures just 12-16 microns in diameter — six times finer than human hair and significantly softer than regular cashmere.

**The Source: Changthangi Goats of Ladakh**

Pashmina wool comes exclusively from the Changthangi goat, a breed native to the high-altitude plateaus of Ladakh and the Changthang region at elevations above 14,000 feet. These hardy animals develop an incredibly fine undercoat to survive temperatures that plunge to -40°C during harsh Himalayan winters.

Each spring, the goats naturally shed this undercoat. Nomadic herders — known as Changpa — carefully comb the fiber by hand, collecting just 80-170 grams from each goat per year. It takes the wool of three to four goats to make a single Pashmina shawl.

**The Art of Weaving**

Once collected, the raw Pashmina is cleaned, sorted, and hand-spun on a traditional spinning wheel called a "charkha." The spinning process alone takes several weeks, as the delicate fibers require extraordinary patience and skill to transform into yarn without breaking.

The yarn is then set up on wooden handlooms in the workshops of Srinagar, where master weavers create the distinctive twill weave that gives Pashmina its characteristic softness and warmth. A plain Pashmina shawl takes about a week to weave, while an embroidered "Kani" shawl can take up to two years.

**LoomLive's Pashmina Promise**

Every Pashmina on LoomLive is GI-certified and comes with a certificate of authenticity. Through our live sessions, you can watch Kashmiri artisans at work and even commission custom designs directly from the weavers.`,
    category: "Textiles",
    readTime: "7 min read",
    date: "February 20, 2026",
  },
  {
    id: "blue-pottery-jaipur",
    title: "Blue Pottery of Jaipur: A Turko-Persian Art Reimagined in Rajasthan",
    excerpt: "Discover the unique clay-free pottery tradition of Jaipur. Learn how Blue Pottery uses quartz stone, glass, and multani mitti to create stunning cobalt-blue ceramics beloved worldwide.",
    content: `Jaipur's Blue Pottery is unlike any other ceramic tradition in India — primarily because it uses no clay at all. Instead, this distinctive craft employs a mixture of quartz stone powder, powdered glass, multani mitti (Fuller's earth), borax, gum, and water to create its signature pieces.

**A Turko-Persian Legacy**

Blue Pottery arrived in India through Central Asian trade routes, carrying with it the Turko-Persian tradition of glazed pottery. The craft was adopted and reimagined by Rajasthani artisans, who infused it with local motifs and the vibrant aesthetic sensibilities of Jaipur.

The art form nearly died out in the mid-20th century but was revived through the efforts of artist Kripal Singh Shekhawat, who is credited with modernizing the craft and training a new generation of potters.

**The Making Process**

Creating Blue Pottery is a delicate, multi-step process. The dough-like mixture is rolled and shaped entirely by hand — no potter's wheel is used. Once shaped, pieces are dried, hand-painted with cobalt oxide (which gives the characteristic blue color), and then fired in a kiln at relatively low temperatures (around 850°C).

The painting requires exceptional skill. Artisans use fine brushes to create intricate floral and geometric patterns, often inspired by Mughal architecture and Persian tile work. The most common motifs include lotus flowers, intertwining vines, and peacocks.

**Shop Authentic Blue Pottery on LoomLive**

On Loom Live, we work with Blue Pottery artisans from Jaipur's traditional potters' colony. Each piece — from decorative plates and vases to tiles and coasters — is handcrafted and unique. Watch the artisans paint their designs live and bring a piece of Rajasthan's heritage into your home.`,
    category: "Pottery",
    readTime: "5 min read",
    date: "February 12, 2026",
  },
  {
    id: "buy-handloom-saree-online-guide",
    title: "How to Buy Handloom Saree Online: Complete Guide to Authentic Indian Sarees",
    excerpt: "Looking to buy handloom saree online? Learn how to identify authentic handwoven sarees, avoid counterfeits, check GI tags, and shop directly from Indian weavers on LoomLive.",
    content: `Buying a handloom saree online can feel daunting — how do you know if it's genuinely handwoven? How can you tell a real Banarasi from a powerloom imitation? This comprehensive guide will help you buy handloom sarees online with confidence.

**Why Buy Handloom Sarees Online?**

The traditional way of buying sarees involved visiting local shops or traveling to weaving centers. But today, platforms like LoomLive have made it possible to buy handloom sarees online directly from the artisans who weave them — cutting out middlemen and ensuring fair prices for both buyers and weavers.

When you buy a handloom saree online from LoomLive, you're not just purchasing fabric — you're supporting a family of weavers and preserving centuries of cultural heritage.

**How to Identify an Authentic Handloom Saree**

1. **Check the GI Tag** — Geographical Indication tags certify that the saree was made in its traditional region using authentic techniques. Banarasi sarees from Varanasi, Kanchipuram silks from Tamil Nadu, and Pochampally ikat from Telangana all have GI certification.

2. **Look at the Selvedge** — The edges of a handloom saree are typically tighter and more uniform than powerloom versions. Handloom selvedges often have a slight irregularity that proves human craftsmanship.

3. **Examine the Pallu** — In handwoven sarees, the pallu (decorative end piece) often has slight variations in the pattern — this is a sign of authentic hand-weaving, not a defect.

4. **Feel the Fabric** — Handloom sarees have a distinctive texture. Pure silk handlooms feel crisp yet supple, and they develop a beautiful drape over time.

5. **Check the Reverse Side** — In many handloom weaves, the reverse side is almost as neat as the front. Powerloom sarees often have loose threads and uneven patterns on the back.

**Best Types of Handloom Sarees to Buy Online**

- **Banarasi Silk** — Perfect for weddings and festivals. Price range: ₹5,000 to ₹5,00,000+
- **Kanchipuram Silk** — South India's premier bridal saree. Known for durability.
- **Chanderi** — Lightweight and elegant, ideal for daily wear and office.
- **Pochampally Ikat** — Stunning geometric patterns from Telangana.
- **Tussar Silk** — Raw, textured silk with a natural golden sheen from Jharkhand and Bihar.
- **Jamdani** — Muslin-based sarees with intricate motifs woven on the loom.

**Why LoomLive is the Best Place to Buy Handloom Sarees Online**

On LoomLive, every saree comes with GI certification and a certificate of authenticity. You can watch artisans weave your saree live, ask questions in real-time, and even request custom designs. No middlemen, no markups — just authentic handloom sarees at fair prices, delivered to your doorstep.`,
    category: "Shopping Guide",
    readTime: "6 min read",
    date: "March 7, 2026",
  },
  {
    id: "handmade-gifts-from-india",
    title: "10 Best Handmade Gifts from India: Unique Artisan Crafts for Every Occasion",
    excerpt: "Looking for unique handmade gifts from India? From Pashmina shawls to Madhubani paintings, discover 10 authentic Indian artisan gifts perfect for weddings, birthdays, and festivals.",
    content: `Finding the perfect gift is an art in itself. When you choose handmade gifts from India, you're giving something truly unique — a piece of living heritage crafted by skilled artisans using techniques passed down through generations.

Here are 10 exceptional handmade gifts from India available on LoomLive:

**1. Pashmina Shawl from Kashmir**

Nothing says luxury like a genuine Kashmiri Pashmina. Hand-spun from the finest Changthangi goat wool, these shawls are incredibly soft and warm. Perfect for: Anniversaries, milestone birthdays, winter weddings. Price range: ₹8,000 - ₹80,000.

**2. Banarasi Silk Dupatta**

A Banarasi silk dupatta makes an elegant and versatile gift. Woven with gold zari work, it adds opulence to any outfit. Perfect for: Diwali, Raksha Bandhan, bridal showers. Price range: ₹2,000 - ₹15,000.

**3. Madhubani Painting**

These vibrant folk paintings from Bihar make stunning wall art. Each piece is hand-painted using natural dyes and depicts scenes from mythology or nature. Perfect for: Housewarming, art lovers, corporate gifts. Price range: ₹1,500 - ₹25,000.

**4. Blue Pottery from Jaipur**

Handcrafted decorative plates, vases, and tea sets in the distinctive cobalt blue glaze of Rajasthan. Perfect for: Home décor enthusiasts, wedding gifts. Price range: ₹500 - ₹5,000.

**5. Bidriware from Karnataka**

Striking silver-inlaid metalwork on blackened alloy — jewellery boxes, vases, and decorative pieces. Perfect for: Collectors, unique luxury gifts. Price range: ₹2,000 - ₹20,000.

**6. Chikankari Kurta from Lucknow**

Delicate hand-embroidered cotton or chiffon kurtas featuring the famous white-on-white threadwork of Lucknow. Perfect for: Fashion lovers, birthday gifts. Price range: ₹1,500 - ₹12,000.

**7. Dhokra Brass Figurines from Chhattisgarh**

Ancient lost-wax casting technique produces rustic, tribal brass sculptures of animals and deities. Perfect for: Art collectors, desk accessories. Price range: ₹800 - ₹8,000.

**8. Phulkari Dupatta from Punjab**

Vibrant geometric embroidery on fabric, traditionally done by Punjabi women. The name means "flower work." Perfect for: Festivals, bridal gifts, fashion accessories. Price range: ₹1,000 - ₹6,000.

**9. Aranmula Kannadi (Metal Mirror) from Kerala**

These handmade metal mirrors from Kerala are made of a secret copper-tin alloy and are considered auspicious. Perfect for: Traditional ceremonies, luxury gifting. Price range: ₹3,000 - ₹30,000.

**10. Handwoven Ikat Stole from Odisha**

Tie-dye weaving creates mesmerizing geometric patterns on silk or cotton stoles. Perfect for: Casual gifting, accessory lovers. Price range: ₹1,200 - ₹5,000.

**Shop Authentic Handmade Indian Gifts on LoomLive**

Every item on Loom Live is sourced directly from verified artisans across India. Browse our collection, watch artisans create live, and give a gift that tells a story.`,
    category: "Gift Guide",
    readTime: "7 min read",
    date: "March 6, 2026",
  },
  {
    id: "indian-handloom-vs-powerloom",
    title: "Handloom vs Powerloom: How to Tell the Difference When Shopping Online",
    excerpt: "Can't tell handloom from powerloom? Learn the key differences in texture, weave, price, and quality. Stop overpaying for machine-made fabric marketed as handloom.",
    content: `One of the biggest challenges when you buy Indian textiles online is distinguishing genuine handloom from powerloom imitations. Unscrupulous sellers often market powerloom products as handloom at inflated prices. Here's how to protect yourself.

**What is Handloom?**

Handloom refers to fabric woven entirely by hand on a manually operated loom. The weaver controls every aspect — the tension, the pattern, the speed. This human touch gives handloom fabrics their distinctive character, slight irregularities, and artisan quality.

**What is Powerloom?**

Powerloom uses electrically powered machines to weave fabric. It's faster, cheaper, and produces perfectly uniform output. While powerloom fabrics serve their purpose, they lack the soul and craft heritage of handloom.

**Key Differences: Handloom vs Powerloom**

**Texture and Feel**
- Handloom: Slightly irregular texture, soft and breathable, develops character with wear
- Powerloom: Perfectly smooth and uniform, can feel stiff or synthetic

**Selvedge (Edges)**
- Handloom: Edges are woven into the fabric, creating a neat, tight selvedge
- Powerloom: Edges are often cut and sealed, may fray

**Pattern and Design**
- Handloom: Minor variations in motif placement — proof of hand-craftsmanship
- Powerloom: Perfectly identical, machine-precise repetition

**Weight and Drape**
- Handloom: Generally lighter with a natural, flowing drape
- Powerloom: Can feel heavier or stiffer due to tighter machine tension

**Price**
- Handloom: Higher priced due to labor-intensive process (days to months per piece)
- Powerloom: Significantly cheaper due to mass production

**Environmental Impact**
- Handloom: Zero electricity consumption, minimal carbon footprint
- Powerloom: High energy consumption, larger environmental impact

**The Handloom Mark**

The Government of India issues a "Handloom Mark" to certify genuine handloom products. Look for this certification when buying online. On LoomLive, every product comes with verified authenticity documentation.

**Why Choose Handloom?**

When you buy handloom, you're supporting rural artisan communities, preserving ancient craft traditions, and choosing sustainable fashion. Each handloom purchase on LoomLive directly funds a weaver's livelihood and keeps India's textile heritage alive.`,
    category: "Education",
    readTime: "5 min read",
    date: "March 4, 2026",
  },
  {
    id: "kanchipuram-silk-saree-wedding",
    title: "Kanchipuram Silk Saree for Wedding: The Ultimate Bridal Guide",
    excerpt: "Planning to buy a Kanchipuram silk saree for your wedding? Learn about authentic Kanchipuram weaves, how to choose the right one, price ranges, and where to buy genuine temple silk sarees online.",
    content: `The Kanchipuram silk saree is the undisputed queen of South Indian bridal wear. Known locally as "Kanjeevaram," these sarees are woven in the temple town of Kanchipuram in Tamil Nadu and have been the preferred choice for brides for over 400 years.

**What Makes Kanchipuram Silk Special?**

Kanchipuram sarees are unique because of their construction. Unlike most sarees, the body and border of a Kanchipuram are woven separately and then interlocked — a technique called "korvai." This is why these sarees are known for their exceptional durability. A well-maintained Kanchipuram can last a lifetime and be passed down as a family heirloom.

The silk used is pure mulberry silk, and the zari is traditionally made with real silver threads dipped in gold. Modern versions use tested zari, but the finest bridal sarees still use pure gold zari.

**How to Choose a Kanchipuram Silk Saree for Your Wedding**

**Consider the Weight**
Bridal Kanchipurams typically weigh between 700g to 1kg. Heavier sarees (with more zari work) drape beautifully in photographs but can be tiring to wear all day. A 750-800g saree offers the best balance of grandeur and comfort.

**Choose Your Motifs**
Traditional motifs include:
- Temple borders (inspired by gopuram architecture)
- Mango (paisley) designs
- Peacocks and parrots
- Checks and stripes for the body
- Mythological scenes on the pallu

**Select Your Color**
Classic bridal colors include deep red, maroon, mustard yellow, and green. Modern brides are also choosing jewel tones like teal, magenta, and royal blue.

**Check Authenticity**
Every genuine Kanchipuram saree comes with a silk mark hologram and GI tag. The Kanchipuram Silk Handloom Weavers' Cooperative Society (known as "Co-optex") is a trusted source.

**Price Guide for Kanchipuram Bridal Sarees**
- Pure silk with tested zari: ₹15,000 - ₹40,000
- Pure silk with silver zari: ₹40,000 - ₹1,00,000
- Pure silk with gold zari: ₹1,00,000 - ₹5,00,000+
- Antique/heritage pieces: ₹5,00,000+

**Buy Authentic Kanchipuram Sarees on LoomLive**

On Loom Live, we partner directly with master weavers in Kanchipuram. Watch your bridal saree being woven on a live stream, choose custom colors and motifs, and receive your saree with full authentication. Every Kanchipuram on LoomLive is GI-certified and comes with a lifetime authenticity guarantee.`,
    category: "Bridal Guide",
    readTime: "6 min read",
    date: "March 2, 2026",
  },
  {
    id: "sustainable-fashion-india-handloom",
    title: "Sustainable Fashion in India: Why Handloom is the Future of Eco-Friendly Clothing",
    excerpt: "Discover why Indian handloom is the world's most sustainable fashion choice. Learn about zero-waste weaving, natural dyes, and how buying handloom reduces your carbon footprint.",
    content: `In a world increasingly concerned about fast fashion's environmental impact, Indian handloom stands as a beacon of sustainable, ethical fashion. Here's why handloom is not just a tradition — it's the future of eco-friendly clothing.

**The Environmental Crisis of Fast Fashion**

The global fashion industry produces 10% of all carbon emissions — more than international flights and maritime shipping combined. It's the second-largest consumer of water worldwide, and 85% of all textiles end up in landfills each year.

Indian handloom offers a powerful alternative.

**Why Handloom is Inherently Sustainable**

**Zero Electricity, Zero Emissions**
Handloom weaving uses no electricity. The loom is powered entirely by human hands and feet. A handloom weaver's carbon footprint is virtually zero, compared to powerloom factories that consume massive amounts of energy.

**Natural Fibers**
Traditional handloom uses natural fibers — cotton, silk, wool, jute — that are biodegradable. Unlike polyester (which takes 200+ years to decompose), a cotton handloom saree returns to the earth naturally.

**Natural Dyes**
Many handloom traditions use plant-based dyes: indigo from the indigofera plant, turmeric for yellow, pomegranate rind for gold, lac for red. These natural dyes are non-toxic and don't pollute waterways like synthetic chemical dyes.

**Zero-Waste Production**
In handloom weaving, virtually no fabric is wasted. The weaver creates exactly what's needed, thread by thread. Even leftover yarn is repurposed into smaller items like bookmarks, pouches, or tassels.

**Minimal Water Usage**
Handloom production uses a fraction of the water consumed by industrial textile manufacturing. A handloom cotton saree uses approximately 30 liters of water, compared to 2,700 liters for a single mass-produced cotton t-shirt.

**The Social Impact**

India's handloom sector employs over 3.5 million weavers — making it the second-largest employer in the country after agriculture. When you buy handloom, you directly support rural livelihoods and help keep families in their ancestral homes rather than migrating to overcrowded cities.

**How to Build a Sustainable Wardrobe with Handloom**

- Replace synthetic stoles and scarves with handwoven cotton or silk alternatives
- Choose handloom sarees for festivals and celebrations
- Look for handloom kurtas and shirts for daily wear
- Invest in handwoven bed linen and home textiles

**Shop Sustainable Fashion on LoomLive**

At LoomLive, sustainability isn't a marketing label — it's built into every product. Browse our collection of handwoven, naturally dyed, ethically sourced textiles. Watch artisans create sustainably in real-time through our live sessions.`,
    category: "Sustainability",
    readTime: "6 min read",
    date: "February 25, 2026",
  },
  {
    id: "best-indian-paintings-wall-art-online",
    title: "Best Indian Paintings & Wall Art to Buy Online: Madhubani, Warli, Tanjore & More",
    excerpt: "Looking for authentic Indian paintings and wall art online? Explore Madhubani, Warli, Tanjore, Pattachitra, and Gond art — learn about each style and where to buy original artisan paintings.",
    content: `Indian art traditions span thousands of years and dozens of distinct styles, each rooted in a specific region and community. If you're looking to buy Indian paintings or wall art online, here's your complete guide to the most popular and collectible styles.

**1. Madhubani Painting (Bihar)**

Origin: Mithila region of Bihar, 2,500+ years old
Medium: Natural dyes on handmade paper or canvas
Subjects: Hindu mythology, nature, wedding scenes, geometric patterns
Price range: ₹1,500 - ₹50,000
Best for: Colorful, vibrant wall décor with cultural depth

Madhubani art is characterized by bold outlines, vibrant colors, and intricate fill patterns. Originally painted on mud walls by women, it's now one of India's most recognized art exports. On LoomLive, buy directly from Madhubani artists in Jitwarpur village.

**2. Warli Painting (Maharashtra)**

Origin: Warli tribe of Maharashtra, 3,000+ years old
Medium: White rice paste on red/brown backgrounds
Subjects: Daily life, farming, dancing, nature, animals
Price range: ₹800 - ₹20,000
Best for: Minimalist, tribal aesthetic for modern interiors

Warli art uses simple geometric shapes — circles, triangles, and lines — to depict community life. Its monochromatic palette makes it versatile for contemporary home décor.

**3. Tanjore Painting (Tamil Nadu)**

Origin: Thanjavur, Tamil Nadu, 16th century
Medium: Gold leaf, semi-precious stones on wooden panels
Subjects: Hindu deities, especially Krishna, Lakshmi, and Ganesha
Price range: ₹5,000 - ₹2,00,000+
Best for: Luxury traditional art, temple rooms, prayer spaces

Tanjore paintings are known for their rich gold foil work and embedded gems. These are not just paintings — they're three-dimensional artworks with raised surfaces and sparkling embellishments.

**4. Pattachitra (Odisha & West Bengal)**

Origin: Odisha and West Bengal, 1,000+ years old
Medium: Natural colors on cloth or dried palm leaf
Subjects: Jagannath temple stories, Ramayana, Krishna leela
Price range: ₹2,000 - ₹30,000
Best for: Storytelling art with intricate detailing

Pattachitra literally means "cloth picture." Artists use incredibly fine brushes (sometimes a single hair) to create these narrative scrolls with extraordinary precision.

**5. Gond Art (Madhya Pradesh)**

Origin: Gond tribe of Madhya Pradesh, 1,400+ years old
Medium: Acrylic or natural dyes on paper/canvas
Subjects: Flora, fauna, mythology, dreams
Price range: ₹1,000 - ₹40,000
Best for: Contemporary tribal art with dot-and-dash patterns

Gond paintings feature intricate dot-and-line patterns that fill every space, creating a mesmerizing visual texture. Modern Gond artists have gained international recognition in galleries worldwide.

**6. Pichwai Painting (Rajasthan)**

Origin: Nathdwara, Rajasthan, 17th century
Medium: Natural pigments on cloth
Subjects: Lord Krishna, lotus ponds, cows, festive scenes
Price range: ₹3,000 - ₹1,00,000
Best for: Devotional art, large-format wall pieces

**How to Buy Authentic Indian Art Online**

- Always buy from platforms that connect you directly with artists (like LoomLive)
- Ask for an authenticity certificate
- Check the artist's background and regional credentials
- Avoid mass-printed reproductions marketed as originals

**Buy Original Indian Art on LoomLive**

Every painting on Loom Live is hand-painted by verified artisan artists. Watch them create in live sessions, commission custom pieces, and receive artwork with full provenance documentation.`,
    category: "Art Guide",
    readTime: "8 min read",
    date: "February 15, 2026",
  },
];

const Blog = () => {
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const activePost = blogPosts.find((p) => p.id === selectedPost);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>

          {activePost ? (
            <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <button
                onClick={() => setSelectedPost(null)}
                className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-secondary/80 mb-6"
              >
                <ArrowLeft className="h-4 w-4" /> All articles
              </button>
              <Badge className="bg-secondary/20 text-secondary border-0 text-xs mb-3">
                <Tag className="h-3 w-3 mr-1" /> {activePost.category}
              </Badge>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-snug">
                {activePost.title}
              </h1>
              <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {activePost.readTime}</span>
                <span>·</span>
                <span>{activePost.date}</span>
              </div>
              <div className="mt-8 prose prose-neutral max-w-none text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4 [&_strong]:text-foreground [&_h2]:font-display [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_ol]:space-y-1 [&_li]:text-sm">
                {activePost.content.split("\n\n").map((paragraph, i) => {
                  if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
                    return <h2 key={i}>{paragraph.replace(/\*\*/g, "")}</h2>;
                  }
                  if (paragraph.match(/^\d+\./)) {
                    const items = paragraph.split("\n").filter(Boolean);
                    return (
                      <ol key={i} className="list-decimal list-inside space-y-1">
                        {items.map((item, j) => (
                          <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/^\d+\.\s*/, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                        ))}
                      </ol>
                    );
                  }
                  return <p key={i} dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
                })}
              </div>
            </motion.article>
          ) : (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                LoomLive Blog
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Stories from the loom, the kiln, and the artisan's hands — exploring India's living craft traditions.
              </p>

              <div className="mt-10 grid gap-6">
                {blogPosts.map((post, i) => (
                  <motion.button
                    key={post.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => setSelectedPost(post.id)}
                    className="text-left p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-card-hover transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className="bg-secondary/20 text-secondary border-0 text-xs">
                        <Tag className="h-3 w-3 mr-1" /> {post.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {post.readTime}
                      </span>
                      <span className="text-xs text-muted-foreground">{post.date}</span>
                    </div>
                    <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Blog;
