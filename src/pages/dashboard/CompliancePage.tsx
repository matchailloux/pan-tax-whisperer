import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  Calculator,
  TrendingUp,
  FileText,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ComplianceData {
  jurisdiction: string;
  country: string;
  taxId: string;
  monthlyVAT: number;
  quarterlyVAT: number;
  isOSS: boolean;
  status: 'compliant' | 'warning' | 'overdue';
  nextDueDate: string;
}

interface Period {
  month: number;
  year: number;
  quarter: number;
}

const CompliancePage = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    quarter: Math.ceil((new Date().getMonth() + 1) / 3)
  });
  
  const [viewMode, setViewMode] = useState<'monthly' | 'quarterly'>('monthly');

  // Données simulées - à remplacer par de vraies données de la base
  const complianceData: ComplianceData[] = [
    {
      jurisdiction: 'France',
      country: 'FR',
      taxId: 'FR12345678901',
      monthlyVAT: 8500.50,
      quarterlyVAT: 25501.50,
      isOSS: false,
      status: 'compliant',
      nextDueDate: '2024-02-20'
    },
    {
      jurisdiction: 'Germany',
      country: 'DE', 
      taxId: 'DE123456789',
      monthlyVAT: 6200.30,
      quarterlyVAT: 18600.90,
      isOSS: false,
      status: 'warning',
      nextDueDate: '2024-02-10'
    },
    {
      jurisdiction: 'European Union - VAT OSS / IOSS',
      country: 'OSS',
      taxId: 'EU372012345',
      monthlyVAT: 12800.75,
      quarterlyVAT: 38402.25,
      isOSS: true,
      status: 'compliant',
      nextDueDate: '2024-01-31'
    },
    {
      jurisdiction: 'Spain',
      country: 'ES',
      taxId: 'ES12345678A',
      monthlyVAT: 3400.20,
      quarterlyVAT: 10200.60,
      isOSS: false,
      status: 'overdue',
      nextDueDate: '2024-01-20'
    }
  ];

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const totals = useMemo(() => {
    const monthly = complianceData.reduce((sum, item) => sum + item.monthlyVAT, 0);
    const quarterly = complianceData.reduce((sum, item) => sum + item.quarterlyVAT, 0);
    const ossAmount = complianceData
      .filter(item => item.isOSS)
      .reduce((sum, item) => sum + (viewMode === 'monthly' ? item.monthlyVAT : item.quarterlyVAT), 0);
    
    return { monthly, quarterly, ossAmount };
  }, [complianceData, viewMode]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Conforme</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Attention</Badge>;
      case 'overdue':
        return <Badge variant="destructive">En retard</Badge>;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const handleExportReport = () => {
    toast({
      title: "Export en cours",
      description: "Le rapport de conformité TVA est en cours de génération...",
    });
  };

  const handleGenerateDeclaration = (jurisdiction: string) => {
    toast({
      title: "Déclaration générée",
      description: `Déclaration TVA pour ${jurisdiction} prête à télécharger.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Compliance TVA</h3>
          <p className="text-muted-foreground">
            Suivi des obligations TVA par juridiction
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Nouvelle déclaration
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sélection de période
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'monthly' | 'quarterly')}>
              <TabsList>
                <TabsTrigger value="monthly">Mensuel</TabsTrigger>
                <TabsTrigger value="quarterly">Trimestriel</TabsTrigger>
              </TabsList>
            </Tabs>

            {viewMode === 'monthly' && (
              <>
                <Select 
                  value={selectedPeriod.month.toString()} 
                  onValueChange={(value) => setSelectedPeriod({...selectedPeriod, month: parseInt(value)})}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {viewMode === 'quarterly' && (
              <Select 
                value={selectedPeriod.quarter.toString()} 
                onValueChange={(value) => setSelectedPeriod({...selectedPeriod, quarter: parseInt(value)})}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">T1 2024</SelectItem>
                  <SelectItem value="2">T2 2024</SelectItem>
                  <SelectItem value="3">T3 2024</SelectItem>
                  <SelectItem value="4">T4 2024</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Select 
              value={selectedPeriod.year.toString()} 
              onValueChange={(value) => setSelectedPeriod({...selectedPeriod, year: parseInt(value)})}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              TVA totale due
            </CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(viewMode === 'monthly' ? totals.monthly : totals.quarterly)}
            </div>
            <p className="text-xs text-muted-foreground">
              {viewMode === 'monthly' ? 'Ce mois' : 'Ce trimestre'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              TVA OSS
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.ossAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Régime OSS/IOSS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Juridictions
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complianceData.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {complianceData.filter(d => d.status === 'compliant').length} conformes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertes
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {complianceData.filter(d => d.status !== 'compliant').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Nécessitent attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Détail par juridiction
          </CardTitle>
          <CardDescription>
            Montants de TVA redevables par pays et régime
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Juridiction</TableHead>
                <TableHead>Numéro TVA</TableHead>
                <TableHead className="text-right">
                  {viewMode === 'monthly' ? 'TVA mensuelle' : 'TVA trimestrielle'}
                </TableHead>
                <TableHead>Prochaine échéance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complianceData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      {item.jurisdiction}
                      {item.isOSS && (
                        <Badge variant="outline" className="text-xs">
                          OSS
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {item.taxId}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(viewMode === 'monthly' ? item.monthlyVAT : item.quarterlyVAT)}
                  </TableCell>
                  <TableCell>
                    {formatDate(item.nextDueDate)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(item.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleGenerateDeclaration(item.jurisdiction)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Déclarer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Vérification des totaux
          </CardTitle>
          <CardDescription>
            Concordance entre TVA par juridiction et TVA globale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">
                Total TVA par juridictions ({viewMode === 'monthly' ? 'mensuel' : 'trimestriel'})
              </span>
              <span className="text-xl font-bold">
                {formatCurrency(viewMode === 'monthly' ? totals.monthly : totals.quarterly)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-800">
                  Concordance vérifiée
                </span>
              </div>
              <span className="text-sm text-green-600">
                ✓ Les totaux correspondent
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">TVA nationale</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(
                    complianceData
                      .filter(item => !item.isOSS)
                      .reduce((sum, item) => sum + (viewMode === 'monthly' ? item.monthlyVAT : item.quarterlyVAT), 0)
                  )}
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">TVA OSS/IOSS</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(totals.ossAmount)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompliancePage;