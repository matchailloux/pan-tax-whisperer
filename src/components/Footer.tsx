import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  const links = {
    product: [
      { name: "Fonctionnalités", href: "#" },
      { name: "Tarifs", href: "#" },
      { name: "API", href: "#" },
      { name: "Intégrations", href: "#" }
    ],
    support: [
      { name: "Documentation", href: "#" },
      { name: "Support", href: "#" },
      { name: "Status", href: "#" },
      { name: "Formation", href: "#" }
    ],
    company: [
      { name: "À propos", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Carrières", href: "#" },
      { name: "Presse", href: "#" }
    ],
    legal: [
      { name: "Confidentialité", href: "#" },
      { name: "Conditions", href: "#" },
      { name: "Cookies", href: "#" },
      { name: "RGPD", href: "#" }
    ]
  };

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">VS</span>
              </div>
              <span className="text-xl font-bold">VATSync</span>
            </div>
            <p className="text-muted-foreground max-w-sm">
              Simplifiez la gestion de votre TVA Amazon FBA avec notre solution 
              automatisée pour les vendeurs du programme PAN EU.
            </p>
            <div className="flex gap-4">
              <Button variant="hero" size="sm">
                Démarrer gratuitement
              </Button>
            </div>
          </div>

          {/* Links Sections */}
          <div className="space-y-4">
            <h3 className="font-semibold">Produit</h3>
            <ul className="space-y-2">
              {links.product.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-smooth text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Support</h3>
            <ul className="space-y-2">
              {links.support.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-smooth text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Entreprise</h3>
            <ul className="space-y-2">
              {links.company.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-smooth text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Légal</h3>
            <ul className="space-y-2">
              {links.legal.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-smooth text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2024 VATSync. Tous droits réservés.</p>
          <div className="flex gap-6">
            <span>🇫🇷 Fait en France</span>
            <span>🔒 Données sécurisées</span>
            <span>✓ Conforme RGPD</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;