import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, FileText, Shield, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const AccountantSection = () => {
  const features = [
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Gestion multi-clients",
      description: "Gérez tous vos clients Amazon FBA depuis une interface unique et intuitive"
    },
    {
      icon: <FileText className="w-8 h-8 text-primary" />,
      title: "Analyses par client",
      description: "Analyses TVA dédiées et historique complet pour chaque client"
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Invitations sécurisées",
      description: "Vos clients uploadent leurs fichiers via des liens d'invitation sécurisés"
    },
    {
      icon: <Clock className="w-8 h-8 text-primary" />,
      title: "Gain de temps",
      description: "Automatisez la ventilation TVA pour tous vos clients e-commerce"
    }
  ];

  const workflow = [
    "Créez votre compte cabinet comptable",
    "Ajoutez vos clients dans votre interface",
    "Générez des invitations sécurisées pour chaque client",
    "Vos clients uploadent leurs fichiers via le lien d'invitation",
    "Analysez automatiquement la TVA par client",
    "Exportez les rapports pour vos déclarations"
  ];

  return (
    <section id="accountant" className="py-24 bg-gradient-to-br from-secondary/20 to-accent/10">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Building2 className="w-4 h-4" />
            Solution pour cabinets comptables
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Simplifiez la gestion TVA
            <span className="bg-gradient-hero bg-clip-text text-transparent"> pour tous vos clients</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Interface spécialisée pour les comptables gérant plusieurs clients Amazon FBA. 
            Invitations sécurisées, analyses automatisées et rapports dédiés par client.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="hero" asChild>
              <Link to="/auth?type=accountant">
                Créer mon cabinet
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="#pricing">
                Voir les tarifs
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-elegant transition-smooth">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Workflow */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-12">
            Comment ça fonctionne pour votre cabinet
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflow.map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {index + 1}
                </div>
                <div className="pt-1">
                  <p className="text-sm font-medium">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-4">
            Prêt à révolutionner votre gestion TVA ?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Rejoignez les cabinets comptables qui font confiance à SellCount pour automatiser 
            la gestion TVA Amazon de leurs clients.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="hero" asChild>
              <Link to="/auth?type=accountant">
                Essai gratuit 14 jours
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span>Configuration en moins de 5 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AccountantSection;