import { useMemo } from 'react';
import { useVATReports } from '@/hooks/useVATReports';
import { useJurisdictions } from '@/hooks/useJurisdictions';

export interface VATComplianceData {
  jurisdiction: string;
  country: string;
  taxId: string;
  vatDue: number; // TVA due réelle calculée depuis TOTAL_ACTIVITY_VALUE_VAT_AMT
  salesAmount: number; // Montant des ventes HT
  vatCollected: number; // TVA collectée (depuis CSV)
  regimes: string[];
  isOSS: boolean;
  status: 'compliant' | 'warning' | 'overdue';
  nextDueDate: string;
  transactions: number; // Nombre de transactions
}

export const useVATCompliance = () => {
  const { reports, loading } = useVATReports();
  const { jurisdictions } = useJurisdictions();

  // Get configured countries from jurisdictions
  const configuredCountries = useMemo(() => {
    const countries = new Set<string>();
    jurisdictions.forEach(j => {
      if (j.jurisdiction === 'France') countries.add('FR');
      else if (j.jurisdiction === 'Germany') countries.add('DE');
      else if (j.jurisdiction === 'Spain') countries.add('ES');
      else if (j.jurisdiction === 'Italy') countries.add('IT');
      else if (j.jurisdiction === 'European Union - VAT OSS / IOSS') {
        // OSS covers multiple countries
        countries.add('OSS');
      }
    });
    return Array.from(countries);
  }, [jurisdictions]);

  const complianceData = useMemo(() => {
    if (!reports || reports.length === 0) return [];

    const countryData = new Map<string, {
      salesAmount: number;
      vatCollected: number;
      regimes: Set<string>;
      isOSS: boolean;
      transactions: number;
    }>();

    // Analyser tous les rapports pour extraire les données de compliance
    reports.forEach(report => {
      // Utiliser les données déjà calculées par le moteur de règles
      if (report.report_data?.processedTransactions) {
        const transactions = report.report_data.processedTransactions || [];
        
        // Grouper les transactions par pays et régime pour calculer la TVA due
        transactions.forEach((transaction: any) => {
          const vatAmount = Math.abs(transaction.VAT_AMOUNT || 0);
          const salesAmount = transaction.AMOUNT_SIGNED || 0;
          
          // Déterminer le pays et le régime selon les règles du moteur
          let country = '';
          const regimes = new Set<string>();
          let isOSS = false;

          if (transaction.SCHEME === 'UNION-OSS') {
            country = transaction.ARRIVAL;
            regimes.add('OSS');
            isOSS = true;
          } else if (transaction.SCHEME === 'REGULAR') {
            country = transaction.DEPART;
            
            if (!transaction.BUYER_VAT) {
              regimes.add('B2C National');
            } else if (transaction.BUYER_VAT === transaction.DEPART) {
              regimes.add('B2B National');
            } else {
              regimes.add('Intracommunautaire');
            }
          } else if (transaction.SCHEME === 'CH_VOEC') {
            country = transaction.ARRIVAL;
            regimes.add('Suisse');
          }

          if (country && (vatAmount > 0 || salesAmount !== 0)) {
            const existing = countryData.get(country) || {
              salesAmount: 0,
              vatCollected: 0,
              regimes: new Set<string>(),
              isOSS: false,
              transactions: 0
            };

            existing.salesAmount += salesAmount;
            existing.vatCollected += vatAmount;
            existing.transactions += 1;
            
            // Fusionner les régimes
            regimes.forEach(regime => existing.regimes.add(regime));
            if (isOSS) existing.isOSS = true;

            countryData.set(country, existing);
          }
        });
      }
    });

    // 3. Convertir en format ComplianceData
    const countryNames: { [key: string]: string } = {
      'FR': 'France',
      'DE': 'Allemagne', 
      'ES': 'Espagne',
      'IT': 'Italie',
      'NL': 'Pays-Bas',
      'BE': 'Belgique',
      'AT': 'Autriche',
      'PT': 'Portugal',
      'PL': 'Pologne',
      'CZ': 'République Tchèque',
      'SE': 'Suède',
      'DK': 'Danemark',
      'FI': 'Finlande',
      'LU': 'Luxembourg',
      'IE': 'Irlande',
      'GR': 'Grèce',
      'BG': 'Bulgarie',
      'RO': 'Roumanie',
      'HR': 'Croatie',
      'SI': 'Slovénie',
      'SK': 'Slovaquie',
      'EE': 'Estonie',
      'LV': 'Lettonie',
      'LT': 'Lituanie',
      'MT': 'Malte',
      'CY': 'Chypre'
    };

    const result: VATComplianceData[] = Array.from(countryData.entries())
      .map(([country, data]) => {
        const regimeArray = Array.from(data.regimes);
        
        // Générer des numéros de TVA fictifs mais réalistes
        const vatNumbers: { [key: string]: string } = {
          'FR': `FR${Math.floor(Math.random() * 90000000) + 10000000}01`,
          'DE': `DE${Math.floor(Math.random() * 900000000) + 100000000}`,
          'ES': `ES${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 90000000) + 10000000}`,
          'IT': `IT${Math.floor(Math.random() * 90000000000) + 10000000000}`,
        };

        return {
          jurisdiction: data.isOSS ? 'Union Européenne - OSS' : (countryNames[country] || country),
          country: country,
          taxId: data.isOSS ? 'EU372012345' : (vatNumbers[country] || `${country}123456789`),
          vatDue: data.vatCollected, // TVA réelle du CSV
          salesAmount: data.salesAmount, // Ventes HT
          vatCollected: data.vatCollected, // TVA collectée
          regimes: regimeArray,
          isOSS: data.isOSS,
          status: generateStatus(data.vatCollected),
          nextDueDate: generateNextDueDate(country, data.isOSS),
          transactions: data.transactions
        };
      })
      .filter(item => item.vatDue > 0 || item.salesAmount > 0) // Garder seulement les pays avec de l'activité
      .sort((a, b) => b.vatDue - a.vatDue); // Trier par TVA due décroissante

    // Filter by configured jurisdictions only
    const filteredData = result.filter(data => {
      if (configuredCountries.length === 0) return true; // Show all if no jurisdictions configured
      return configuredCountries.includes(data.country) || 
             (configuredCountries.includes('OSS') && data.isOSS);
    });

    return filteredData;
  }, [reports, configuredCountries]);

  const totals = useMemo(() => {
    const totalVATDue = complianceData.reduce((sum, item) => sum + item.vatDue, 0);
    const totalSales = complianceData.reduce((sum, item) => sum + item.salesAmount, 0);
    const ossAmount = complianceData
      .filter(item => item.isOSS)
      .reduce((sum, item) => sum + item.vatDue, 0);
    const nationalAmount = complianceData
      .filter(item => !item.isOSS)
      .reduce((sum, item) => sum + item.vatDue, 0);
    const totalTransactions = complianceData.reduce((sum, item) => sum + item.transactions, 0);
    
    return { 
      totalVATDue, 
      totalSales, 
      ossAmount, 
      nationalAmount, 
      totalTransactions,
      jurisdictions: complianceData.length,
      compliantCount: complianceData.filter(d => d.status === 'compliant').length,
      warningCount: complianceData.filter(d => d.status !== 'compliant').length
    };
  }, [complianceData]);

  return {
    complianceData,
    totals,
    loading,
    reportsCount: reports.length
  };
};

// Utilitaires pour générer des données réalistes
function generateStatus(vatAmount: number): 'compliant' | 'warning' | 'overdue' {
  if (vatAmount === 0) return 'compliant';
  if (vatAmount > 10000) return Math.random() > 0.8 ? 'warning' : 'compliant';
  if (vatAmount > 5000) return Math.random() > 0.9 ? 'warning' : 'compliant';
  return 'compliant';
}

function generateNextDueDate(country: string, isOSS: boolean): string {
  const now = new Date();
  if (isOSS) {
    // OSS: 20 du mois suivant
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 20);
    return nextMonth.toISOString().split('T')[0];
  } else {
    // National: varie selon le pays
    const dueDates: { [key: string]: number } = {
      'FR': 15, // 15 du mois suivant
      'DE': 10, // 10 du mois suivant
      'ES': 20, // 20 du mois suivant
      'IT': 25, // 25 du mois suivant
    };
    const dayOfMonth = dueDates[country] || 20;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);
    return nextMonth.toISOString().split('T')[0];
  }
}