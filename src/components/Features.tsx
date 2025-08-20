import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileSpreadsheet, 
  Calculator, 
  Users, 
  Shield, 
  Clock, 
  TrendingUp,
  Database,
  Download,
  CheckCircle
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: FileSpreadsheet,
      title: "Import CSV Amazon",
      description: "Importez directement vos rapports de transaction TVA Amazon au format CSV",
      color: "bg-gradient-primary"
    },
    {
      icon: Calculator,
      title: "Ventilation automatique",
      description: "Calcul automatique par pays et régime : Local B2C/B2B, Intracommunautaire, OSS",
      color: "bg-gradient-accent"
    },
    {
      icon: Users,
      title: "Accès comptable",
      description: "Partagez facilement vos données avec votre comptable ou expert-comptable",
      color: "bg-gradient-primary"
    },
    {
      icon: Shield,
      title: "Conformité EU",
      description: "Respect total de la réglementation européenne TVA et du programme PAN EU",
      color: "bg-gradient-accent"
    },
    {
      icon: Clock,
      title: "Gain de temps",
      description: "Réduisez de 90% le temps passé sur la préparation de vos déclarations TVA",
      color: "bg-gradient-primary"
    },
    {
      icon: Database,
      title: "Historique sécurisé",
      description: "Conservation sécurisée de tous vos rapports et calculs pour vos archives",
      color: "bg-gradient-accent"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Uploadez votre CSV",
      description: "Importez votre rapport de transaction TVA Amazon",
      icon: FileSpreadsheet
    },
    {
      number: "02", 
      title: "Analyse automatique",
      description: "Notre IA traite et ventile automatiquement vos données",
      icon: TrendingUp
    },
    {
      number: "03",
      title: "Exportez vos résultats",
      description: "Téléchargez vos déclarations prêtes pour vos obligations fiscales",
      icon: Download
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Features Grid */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Tout ce dont vous avez besoin pour
            <span className="bg-gradient-hero bg-clip-text text-transparent"> gérer votre TVA</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Une solution complète et automatisée pour les vendeurs Amazon FBA du programme PAN EU
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="relative group hover:shadow-elegant transition-smooth border-border/50 card-hover animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How it works */}
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold mb-4">Comment ça marche ?</h3>
          <p className="text-lg text-muted-foreground">
            Trois étapes simples pour automatiser votre gestion TVA
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center group">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-smooth shadow-elegant">
                  <step.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-sm">
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-primary to-accent transform -translate-y-1/2" />
                )}
              </div>
              <h4 className="text-xl font-semibold mb-3">{step.title}</h4>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;