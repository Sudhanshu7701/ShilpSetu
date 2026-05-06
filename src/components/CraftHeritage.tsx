import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const crafts = [
  { name: "Banarasi Sarees", region: "Varanasi, Uttar Pradesh", description: "Woven with gold and silver brocade, Banarasi sarees are a symbol of Indian opulence, passed down through generations of master weavers.", emoji: "🧵", category: "Sarees" },
  { name: "Kanchipuram Silk", region: "Tamil Nadu", description: "Known for their durability and lustre, Kanchipuram silks feature temple borders and are integral to South Indian weddings.", emoji: "✨", category: "Sarees" },
  { name: "Pashmina", region: "Kashmir", description: "Handspun from the finest Changthangi goat wool, each Pashmina shawl takes months of painstaking work in the Himalayan valleys.", emoji: "🏔️", category: "Shawls" },
  { name: "Madhubani Art", region: "Bihar", description: "Originating from Mithila, this vibrant folk art uses natural dyes and depicts mythology, nature, and daily life in intricate patterns.", emoji: "🎨", category: "Paintings" },
  { name: "Blue Pottery", region: "Jaipur, Rajasthan", description: "A Turko-Persian craft adopted by Rajasthani artisans, blue pottery uses no clay — only quartz stone, glass, and multani mitti.", emoji: "🏺", category: "Pottery" },
  { name: "Bidriware", region: "Bidar, Karnataka", description: "A 14th-century craft where silver inlay is set into blackened alloy of zinc and copper, creating striking dark metalwork.", emoji: "⚒️", category: "Metalwork" },
];

const CraftHeritage = () => {
  return (
    <section id="heritage" className="py-20 bg-textile">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-sm font-medium text-secondary tracking-wider uppercase">
            Craft Heritage
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-2">
            India's Living Traditions
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Centuries of artistry, preserved and celebrated through every handmade creation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {crafts.map((craft, i) => (
            <motion.div
              key={craft.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link to={`/shop?category=${encodeURIComponent(craft.category)}`}>
                <div className="bg-card rounded-lg p-6 border border-border shadow-card hover:shadow-card-hover transition-shadow group cursor-pointer">
                  <span className="text-3xl mb-3 block">{craft.emoji}</span>
                  <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {craft.name}
                  </h3>
                  <p className="text-xs text-secondary font-medium mt-1">{craft.region}</p>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                    {craft.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CraftHeritage;
