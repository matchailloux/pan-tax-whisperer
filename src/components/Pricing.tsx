import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "29",
      period: "mois",
      description: "Parfait pour débuter avec Amazon FBA",
      features: [
        "Jusqu'à 100 transactions/mois",
        "Ventilation TVA automatique",
        "Export CSV/Excel",
        "Support email",
        "1 utilisateur"
      ],
      popular: false,
      cta: "Commencer",
      variant: "outline" as const
    },
    {
      name: "Professional",
      price: "79",
      period: "mois",
      description: "Pour les vendeurs établis",
      features: [
        "Transactions illimitées",
        "Ventilation TVA avancée",
        "Accès comptable inclus",
        "API intégration",
        "Support prioritaire",
        "Jusqu'à 3 utilisateurs",
        "Historique 2 ans"
      ],
      popular: true,
      cta: "Démarrer l'essai",
      variant: "hero" as const
    },
    {
      name: "Enterprise",
      price: "199",
      period: "mois",
      description: "Pour les grandes entreprises",
      features: [
        "Tout du plan Professional",
        "Utilisateurs illimités",
        "Formation personnalisée",
        "Support téléphonique dédié",
        "SLA 99.9%",
        "Intégration ERP",
        "Audit trail complet"
      ],
      popular: false,
      cta: "Nous contacter",
      variant: "accent" as const
    },
    {
      name: "Cabinet Comptable",
      price: "149",
      period: "mois",
      description: "Solution dédiée aux cabinets comptables",
      features: [
        "Gestion multi-clients illimitée",
        "Interface comptable spécialisée",
        "Invitations clients sécurisées",
        "Analyses TVA par client",
        "Rapports consolidés",
        "Support prioritaire dédié",
        "Formation incluse"
      ],
      popular: false,
      cta: "Créer mon cabinet",
      variant: "accent" as const,
      isAccountant: true
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Tarifs transparents pour
            <span className="bg-gradient-hero bg-clip-text text-transparent"> tous les vendeurs</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choisissez le plan qui correspond à la taille de votre activité Amazon FBA
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${
                plan.popular 
                  ? "border-primary shadow-elegant scale-105" 
                  : "border-border hover:border-primary/50"
              } transition-smooth`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-hero text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Plus populaire
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                
                <div className="py-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">{plan.price}€</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-gradient-accent rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-accent-foreground" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.variant} 
                  size="lg" 
                  className="w-full group"
                  asChild
                >
                  <a href={plan.isAccountant ? '/auth?type=accountant' : '/auth'}>
                    {plan.cta}
                    {plan.popular && <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-8">
            Essai gratuit de 14 jours • Aucune carte de crédit requise • Annulation à tout moment
          </p>
          
          <div className="flex justify-center items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              <span>Conformité RGPD</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              <span>Données chiffrées</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              <span>Support français</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;