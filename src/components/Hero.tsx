import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, FileSpreadsheet, TrendingUp, Users, Shield } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen bg-gradient-subtle flex items-center">
      <div className="container mx-auto px-4 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                <span className="text-sm font-medium">Amazon FBA PAN EU</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                Simplifiez votre 
                <span className="bg-gradient-hero bg-clip-text text-transparent"> gestion TVA</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Automatisez la ventilation de vos ventes Amazon FBA entre TVA nationale, 
                intracommunautaire et OSS. Gagnez du temps et évitez les erreurs.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="group">
                Démarrer gratuitement
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg">
                Voir la démo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Vendeurs actifs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">€50M+</div>
                <div className="text-sm text-muted-foreground">CA traité</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-muted-foreground">Précision</div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <img 
                src={heroImage} 
                alt="Dashboard VATSync pour la gestion TVA Amazon FBA"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
            </div>
            
            {/* Floating cards */}
            <Card className="absolute -bottom-6 -left-6 p-4 shadow-glow bg-card/95 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-accent rounded-lg">
                  <TrendingUp className="w-4 h-4 text-accent-foreground" />
                </div>
                <div>
                  <div className="font-semibold">+23% efficacité</div>
                  <div className="text-sm text-muted-foreground">vs méthode manuelle</div>
                </div>
              </div>
            </Card>
            
            <Card className="absolute -top-6 -right-6 p-4 shadow-glow bg-card/95 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-primary rounded-lg">
                  <Shield className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-semibold">100% conforme</div>
                  <div className="text-sm text-muted-foreground">Réglementation EU</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;