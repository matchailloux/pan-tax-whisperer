import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  BookOpen, 
  MessageCircle, 
  Mail, 
  ExternalLink,
  Search,
  ChevronRight,
  FileText,
  Video,
  Download,
  Star,
  Clock,
  Users,
  Lightbulb
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const { toast } = useToast();

  const quickHelp = [
    {
      title: "Guide de démarrage rapide",
      description: "Commencez à utiliser TVA Analysis Pro en 5 minutes",
      icon: BookOpen,
      badge: "Essentiel",
      time: "5 min"
    },
    {
      title: "Importer vos données Amazon",
      description: "Comment obtenir et importer votre rapport TVA Amazon",
      icon: FileText,
      badge: "Populaire",
      time: "3 min"
    },
    {
      title: "Comprendre les résultats",
      description: "Interpréter les analyses TVA et les classifications",
      icon: Lightbulb,
      badge: "Important",
      time: "7 min"
    },
    {
      title: "Tutoriel vidéo complet",
      description: "Démonstration complète de toutes les fonctionnalités",
      icon: Video,
      badge: "Nouveau",
      time: "15 min"
    }
  ];

  const faqData = [
    {
      question: "Comment obtenir mon rapport TVA Amazon ?",
      answer: "1. Connectez-vous à Amazon Seller Central\n2. Allez dans Rapports → Paiements → Rapports d'activité de transaction\n3. Sélectionnez 'Amazon VAT Transaction Report'\n4. Choisissez votre période (mensuelle recommandée)\n5. Générez et téléchargez le fichier CSV\n6. Importez-le dans TVA Analysis Pro"
    },
    {
      question: "Que signifient les différents types de TVA ?",
      answer: "• OSS (One Stop Shop) : Ventes B2C vers d'autres pays UE\n• B2C Domestique : Ventes aux particuliers dans votre pays\n• B2B Domestique : Ventes aux entreprises avec TVA intracommunautaire\n• Intracommunautaire : Ventes B2B vers d'autres pays UE\n• Export : Ventes vers des pays hors UE (ex: Suisse)"
    },
    {
      question: "Pourquoi mes totaux ne correspondent-ils pas ?",
      answer: "Les écarts peuvent provenir de :\n• Transactions partiellement remboursées\n• Frais Amazon non inclus dans certains calculs\n• Différences de période entre rapports\n• Transactions en cours de traitement\n\nUtilisez la section 'Sanity Checks' pour identifier les écarts précis."
    },
    {
      question: "Comment exporter mes données pour mon comptable ?",
      answer: "1. Après analyse, cliquez sur 'Exporter Excel'\n2. Le fichier contient plusieurs onglets :\n   - Résumé KPI\n   - Ventilation par pays\n   - Vérifications de cohérence\n3. Transmettez ce fichier à votre comptable\n4. Les données sont prêtes pour votre déclaration TVA"
    },
    {
      question: "Mes données sont-elles sécurisées ?",
      answer: "Oui, vos données sont protégées :\n• Chiffrement en transit et au repos\n• Stockage sécurisé sur serveurs européens\n• Accès uniquement avec votre compte\n• Sauvegarde automatique et redondance\n• Conformité RGPD"
    },
    {
      question: "Combien de fichiers puis-je analyser ?",
      answer: "Plan Gratuit :\n• Analyses illimitées\n• 1 GB de stockage\n• Historique de 3 mois\n\nPlans Premium :\n• Stockage étendu\n• Historique illimité\n• Support prioritaire\n• Fonctionnalités avancées"
    }
  ];

  const supportOptions = [
    {
      title: "Email Support",
      description: "Réponse sous 24h en français",
      icon: Mail,
      action: "support@tvaanalysis.pro",
      available: "24/7"
    },
    {
      title: "Chat en direct",
      description: "Support en temps réel",
      icon: MessageCircle,
      action: "Ouvrir le chat",
      available: "Lun-Ven 9h-18h"
    },
    {
      title: "Communauté",
      description: "Forum d'entraide utilisateurs",
      icon: Users,
      action: "Rejoindre",
      available: "24/7"
    }
  ];

  const handleSendMessage = () => {
    if (!supportMessage.trim()) return;
    
    toast({
      title: "Message envoyé",
      description: "Notre équipe vous répondra dans les plus brefs délais.",
    });
    setSupportMessage('');
  };

  const filteredFaq = faqData.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Centre d'aide</h2>
        <p className="text-muted-foreground">
          Documentation, guides et support pour utiliser TVA Analysis Pro
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans l'aide..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Help */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Démarrage rapide</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {quickHelp.map((item, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{item.title}</h4>
                      <Badge variant="secondary" className="text-xs">{item.badge}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {item.time}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Questions fréquentes</CardTitle>
          <CardDescription>
            Trouvez des réponses aux questions les plus communes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-2">
            {filteredFaq.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">{item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-7 pb-4">
                  <div className="text-sm text-muted-foreground whitespace-pre-line">
                    {item.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {filteredFaq.length === 0 && searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune réponse trouvée pour "{searchQuery}"</p>
              <p className="text-sm">Essayez de contacter notre support</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentation Links */}
      <Card>
        <CardHeader>
          <CardTitle>Documentation complète</CardTitle>
          <CardDescription>
            Guides détaillés pour maîtriser toutes les fonctionnalités
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                title: "Guide complet d'utilisation",
                description: "Manuel utilisateur détaillé avec captures d'écran",
                type: "PDF",
                size: "2.3 MB"
              },
              {
                title: "Comprendre les règles TVA européennes",
                description: "Explication des réglementations OSS et intracommunautaires",
                type: "PDF",
                size: "1.8 MB"
              },
              {
                title: "Intégration avec votre logiciel comptable",
                description: "Comment utiliser les exports avec Sage, Ciel, etc.",
                type: "PDF",
                size: "1.2 MB"
              },
              {
                title: "API Documentation",
                description: "Documentation technique pour les développeurs",
                type: "Web",
                size: "En ligne"
              }
            ].map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">{doc.title}</h4>
                    <p className="text-sm text-muted-foreground">{doc.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{doc.type}</div>
                    <div>{doc.size}</div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Support Options */}
      <Card>
        <CardHeader>
          <CardTitle>Contacter le support</CardTitle>
          <CardDescription>
            Différentes façons d'obtenir de l'aide personnalisée
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            {supportOptions.map((option, index) => (
              <div key={index} className="text-center p-6 border rounded-lg hover:shadow-md transition-shadow">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                  <option.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-medium mb-2">{option.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {option.description}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Disponible : {option.available}
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  {option.action}
                </Button>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Envoyer un message</h4>
            <div className="space-y-4">
              <Textarea
                placeholder="Décrivez votre problème ou votre question en détail..."
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                rows={4}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Réponse garantie sous 24h en français
                </p>
                <Button onClick={handleSendMessage} disabled={!supportMessage.trim()}>
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Votre avis nous intéresse
          </CardTitle>
          <CardDescription>
            Aidez-nous à améliorer TVA Analysis Pro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <Star className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Noter l'application</div>
                <div className="text-xs text-muted-foreground">
                  Votre avis sur les stores
                </div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <Lightbulb className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Suggérer une amélioration</div>
                <div className="text-xs text-muted-foreground">
                  Partagez vos idées
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpPage;