/**
 * Moteur de règles TVA basé sur les spécifications YAML complètes
 * Implémente preprocessing, règles de ventilation, vues pivotées et sanity checks
 */

export interface VATRuleData {
  country: string;
  domesticB2C: number;
  domesticB2B: number;
  intracommunautaire: number;
  oss: number;
  total: number;
}

export interface SanityCheckGlobal {
  grandTotal: number;
  ossTotal: number;
  regularTotal: number;
  b2cTotal: number;
  b2bTotal: number;
  intracomTotal: number;
  diffGrandTotalVsSum: number;
  diffRegularVsComponents: number;
  isValid: boolean;
}

export interface SanityCheckByCountry {
  country: string;
  regularTotal: number;
  b2cTotal: number;
  b2bTotal: number;
  intracomTotal: number;
  difference: number;
  isValid: boolean;
}

export interface DetailedVATReport {
  breakdown: VATRuleData[];
  sanityCheckGlobal: SanityCheckGlobal;
  sanityCheckByCountry: SanityCheckByCountry[];
  rulesApplied: {
    ossRules: number;
    domesticB2CRules: number;
    domesticB2BRules: number;
    intracommunautaireRules: number;
    totalProcessed: number;
  };
}

export interface AmazonVATTransaction {
  'TRANSACTION_TYPE'?: string;
  'TAX_REPORTING_SCHEME'?: string;
  'SALE_ARRIVAL_COUNTRY'?: string;
  'SALE_DEPART_COUNTRY'?: string;
  'BUYER_VAT_NUMBER_COUNTRY'?: string;
  'BUYER_VAT_NUMBER'?: string;
  'TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL'?: string;
  'AMOUNT_SIGNED'?: number;
  [key: string]: string | number | undefined;
}

const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

/**
 * Moteur principal de traitement du rapport Amazon VAT selon spécifications YAML
 */
export function processVATWithNewRules(csvContent: string): DetailedVATReport {
  // Étape 1: Parser le CSV
  let transactions = parseAmazonCSV(csvContent);
  
  // Étape 2: Preprocessing selon les spécifications YAML
  transactions = preprocessTransactions(transactions);
  
  // Étape 3: Appliquer les règles de ventilation
  const breakdown = applyVATVentilationRules(transactions);
  
  // Étape 4: Sanity checks globaux
  const sanityCheckGlobal = performGlobalSanityCheck(transactions, breakdown);
  
  // Étape 5: Sanity checks par pays
  const sanityCheckByCountry = performCountrySanityCheck(transactions, breakdown);
  
  // Étape 6: Statistiques des règles appliquées
  const rulesApplied = calculateRulesStatistics(transactions);
  
  console.log('🎯 Moteur de règles TVA YAML appliqué:', {
    transactions: transactions.length,
    pays: breakdown.length,
    sanityGlobal: sanityCheckGlobal.isValid ? '✅ Valide' : '❌ Erreur',
    sanityPays: sanityCheckByCountry.filter(c => !c.isValid).length === 0 ? '✅ Valide' : '❌ Erreurs détectées'
  });
  
  return {
    breakdown,
    sanityCheckGlobal,
    sanityCheckByCountry,
    rulesApplied
  };
}

/**
 * Preprocessing des données selon les spécifications YAML
 */
function preprocessTransactions(transactions: AmazonVATTransaction[]): AmazonVATTransaction[] {
  return transactions.map(transaction => {
    const processed = { ...transaction };
    
    // Step 1: Trim des colonnes essentielles
    const trimColumns = ['TRANSACTION_TYPE', 'TAX_REPORTING_SCHEME', 'SALE_ARRIVAL_COUNTRY', 
                        'SALE_DEPART_COUNTRY', 'BUYER_VAT_NUMBER_COUNTRY'];
    trimColumns.forEach(col => {
      if (processed[col] && typeof processed[col] === 'string') {
        processed[col] = (processed[col] as string).trim();
      }
    });
    
    // Step 2: Uppercase des codes pays
    const uppercaseColumns = ['SALE_ARRIVAL_COUNTRY', 'SALE_DEPART_COUNTRY', 'BUYER_VAT_NUMBER_COUNTRY'];
    uppercaseColumns.forEach(col => {
      if (processed[col] && typeof processed[col] === 'string') {
        processed[col] = (processed[col] as string).toUpperCase();
      }
    });
    
    // Step 3: Normaliser les valeurs vides pour BUYER_VAT_NUMBER_COUNTRY
    const emptyValues = ['', '(VIDE)', '(VIDES)', 'NULL', 'N/A', '-', '—', 'NONE', ' '];
    const buyerVatCountry = processed['BUYER_VAT_NUMBER_COUNTRY'];
    if (typeof buyerVatCountry === 'string' && emptyValues.includes(buyerVatCountry)) {
      processed['BUYER_VAT_NUMBER_COUNTRY'] = '';
    }
    
    // Step 4: Normaliser TAX_REPORTING_SCHEME
    const schemeMapping: { [key: string]: string } = {
      'Union-OSS': 'UNION-OSS',
      'union-oss': 'UNION-OSS',
      'Regular': 'REGULAR',
      'regular': 'REGULAR'
    };
    const scheme = processed['TAX_REPORTING_SCHEME'];
    if (typeof scheme === 'string' && schemeMapping[scheme]) {
      processed['TAX_REPORTING_SCHEME'] = schemeMapping[scheme];
    }
    
    // Step 5: To_number et calcul AMOUNT_SIGNED
    const rawAmount = processed['TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL'];
    let amount = 0;
    
    if (typeof rawAmount === 'string' && rawAmount) {
      // Nettoyer et convertir le montant
      const cleanedAmount = rawAmount
        .replace(/,/g, '.') // Remplacer virgules par points
        .replace(/[€$£¥]/g, '') // Supprimer symboles monétaires
        .replace(/[^\d.-]/g, ''); // Supprimer autres caractères
      amount = parseFloat(cleanedAmount) || 0;
    }
    
    // Calcul du montant signé selon YAML (REFUND en négatif)
    const transactionType = typeof processed['TRANSACTION_TYPE'] === 'string' 
      ? processed['TRANSACTION_TYPE'].toUpperCase().trim() 
      : '';
    if (transactionType === 'REFUND') {
      amount = -Math.abs(amount);
    }
    
    processed['AMOUNT_SIGNED'] = amount;
    
    return processed;
  });
}

/**
 * Application des règles de ventilation TVA selon les spécifications YAML
 */
function applyVATVentilationRules(transactions: AmazonVATTransaction[]): VATRuleData[] {
  const countryBreakdown: { [country: string]: VATRuleData } = {};
  
  transactions.forEach((transaction, index) => {
    // Filtre par défaut: SALES et REFUND seulement
    const transactionType = (transaction['TRANSACTION_TYPE'] || '').toUpperCase().trim();
    if (!['SALES', 'REFUND'].includes(transactionType)) {
      return;
    }
    
    const amountSigned = transaction['AMOUNT_SIGNED'] || 0;
    if (amountSigned === 0) {
      return;
    }
    
    // Appliquer les règles de ventilation
    const ruleResult = applyVentilationRule(transaction);
    if (!ruleResult) {
      console.warn(`⚠️ Transaction ligne ${index + 2} non classifiable:`, {
        scheme: transaction['TAX_REPORTING_SCHEME'],
        departCountry: transaction['SALE_DEPART_COUNTRY'],
        arrivalCountry: transaction['SALE_ARRIVAL_COUNTRY'],
        buyerCountry: transaction['BUYER_VAT_NUMBER_COUNTRY']
      });
      return;
    }
    
    const { country, vatType } = ruleResult;
    
    // Initialiser le pays s'il n'existe pas
    if (!countryBreakdown[country]) {
      countryBreakdown[country] = {
        country,
        domesticB2C: 0,
        domesticB2B: 0,
        intracommunautaire: 0,
        oss: 0,
        total: 0
      };
    }
    
    // Ventiler selon le type de TVA
    switch (vatType) {
      case 'DOMESTIC_B2C':
        countryBreakdown[country].domesticB2C += amountSigned;
        break;
      case 'DOMESTIC_B2B':
        countryBreakdown[country].domesticB2B += amountSigned;
        break;
      case 'INTRACOMMUNAUTAIRE':
        countryBreakdown[country].intracommunautaire += amountSigned;
        break;
      case 'OSS':
        countryBreakdown[country].oss += amountSigned;
        break;
    }
    
    countryBreakdown[country].total += amountSigned;
  });
  
  return Object.values(countryBreakdown).sort((a, b) => a.country.localeCompare(b.country));
}

interface VentilationResult {
  country: string;
  vatType: 'DOMESTIC_B2C' | 'DOMESTIC_B2B' | 'INTRACOMMUNAUTAIRE' | 'OSS';
}

/**
 * Applique les règles de ventilation selon les spécifications YAML
 */
function applyVentilationRule(transaction: AmazonVATTransaction): VentilationResult | null {
  const taxReportingScheme = (transaction['TAX_REPORTING_SCHEME'] || '').toUpperCase().trim();
  const saleArrivalCountry = normalizeCountryCode(transaction['SALE_ARRIVAL_COUNTRY'] || '');
  const saleDepartCountry = normalizeCountryCode(transaction['SALE_DEPART_COUNTRY'] || '');
  const buyerVatNumberCountry = normalizeCountryCode(transaction['BUYER_VAT_NUMBER_COUNTRY'] || '');
  
  // RÈGLE OSS: TAX_REPORTING_SCHEME = "UNION-OSS"
  if (taxReportingScheme === 'UNION-OSS') {
    if (saleArrivalCountry) {
      return { country: saleArrivalCountry, vatType: 'OSS' };
    }
    return null;
  }
  
  // RÈGLES REGULAR (domestique B2C, B2B, intracommunautaire)
  if (taxReportingScheme === 'REGULAR' && saleDepartCountry) {
    
    // RÈGLE DOMESTIC_B2C: REGULAR + BUYER_VAT_NUMBER_COUNTRY vide
    if (!buyerVatNumberCountry || buyerVatNumberCountry === '') {
      return { country: saleDepartCountry, vatType: 'DOMESTIC_B2C' };
    }
    
    // RÈGLE DOMESTIC_B2B: SALE_DEPART_COUNTRY = BUYER_VAT_NUMBER_COUNTRY
    if (buyerVatNumberCountry === saleDepartCountry) {
      return { country: saleDepartCountry, vatType: 'DOMESTIC_B2B' };
    }
    
    // RÈGLE INTRACOMMUNAUTAIRE: SALE_DEPART_COUNTRY ≠ BUYER_VAT_NUMBER_COUNTRY (non vide)
    if (buyerVatNumberCountry && buyerVatNumberCountry !== saleDepartCountry) {
      return { country: saleDepartCountry, vatType: 'INTRACOMMUNAUTAIRE' };
    }
  }
  
  return null;
}

/**
 * Sanity checks globaux selon spécifications YAML
 */
function performGlobalSanityCheck(transactions: AmazonVATTransaction[], breakdown: VATRuleData[]): SanityCheckGlobal {
  // Grand total (toutes transactions filtrées SALES/REFUND)
  const grandTotal = transactions
    .filter(t => ['SALES', 'REFUND'].includes((t['TRANSACTION_TYPE'] || '').toUpperCase().trim()))
    .reduce((sum, t) => sum + (t['AMOUNT_SIGNED'] || 0), 0);
  
  // OSS Total
  const ossTotal = transactions
    .filter(t => {
      const transactionType = (t['TRANSACTION_TYPE'] || '').toUpperCase().trim();
      const scheme = (t['TAX_REPORTING_SCHEME'] || '').toUpperCase().trim();
      return ['SALES', 'REFUND'].includes(transactionType) && scheme === 'UNION-OSS';
    })
    .reduce((sum, t) => sum + (t['AMOUNT_SIGNED'] || 0), 0);
  
  // REGULAR Total  
  const regularTotal = transactions
    .filter(t => {
      const transactionType = (t['TRANSACTION_TYPE'] || '').toUpperCase().trim();
      const scheme = (t['TAX_REPORTING_SCHEME'] || '').toUpperCase().trim();
      return ['SALES', 'REFUND'].includes(transactionType) && scheme === 'REGULAR';
    })
    .reduce((sum, t) => sum + (t['AMOUNT_SIGNED'] || 0), 0);
  
  // Totaux des composants
  const b2cTotal = breakdown.reduce((sum, item) => sum + item.domesticB2C, 0);
  const b2bTotal = breakdown.reduce((sum, item) => sum + item.domesticB2B, 0);
  const intracomTotal = breakdown.reduce((sum, item) => sum + item.intracommunautaire, 0);
  
  // Calculs de différence
  const diffGrandTotalVsSum = grandTotal - (ossTotal + regularTotal);
  const diffRegularVsComponents = regularTotal - (b2cTotal + b2bTotal + intracomTotal);
  
  const isValid = Math.abs(diffGrandTotalVsSum) < 0.01 && Math.abs(diffRegularVsComponents) < 0.01;
  
  return {
    grandTotal,
    ossTotal,
    regularTotal,
    b2cTotal,
    b2bTotal,
    intracomTotal,
    diffGrandTotalVsSum,
    diffRegularVsComponents,
    isValid
  };
}

/**
 * Sanity checks par pays selon spécifications YAML
 */
function performCountrySanityCheck(transactions: AmazonVATTransaction[], breakdown: VATRuleData[]): SanityCheckByCountry[] {
  const countryChecks: SanityCheckByCountry[] = [];
  
  // Obtenir tous les pays SALE_DEPART_COUNTRY
  const countries = new Set<string>();
  transactions.forEach(t => {
    const country = normalizeCountryCode(t['SALE_DEPART_COUNTRY'] || '');
    if (country) countries.add(country);
  });
  
  countries.forEach(country => {
    // REGULAR total pour ce pays (toutes transactions REGULAR avec SALE_DEPART_COUNTRY = country)
    const regularTotal = transactions
      .filter(t => {
        const transactionType = (t['TRANSACTION_TYPE'] || '').toUpperCase().trim();
        const scheme = (t['TAX_REPORTING_SCHEME'] || '').toUpperCase().trim();
        const departCountry = normalizeCountryCode(t['SALE_DEPART_COUNTRY'] || '');
        return ['SALES', 'REFUND'].includes(transactionType) && 
               scheme === 'REGULAR' && 
               departCountry === country;
      })
      .reduce((sum, t) => sum + (t['AMOUNT_SIGNED'] || 0), 0);
    
    // Composants pour ce pays depuis breakdown
    const countryData = breakdown.find(b => b.country === country);
    const b2cTotal = countryData?.domesticB2C || 0;
    const b2bTotal = countryData?.domesticB2B || 0;
    const intracomTotal = countryData?.intracommunautaire || 0;
    
    const difference = regularTotal - (b2cTotal + b2bTotal + intracomTotal);
    const isValid = Math.abs(difference) < 0.01;
    
    if (regularTotal !== 0 || b2cTotal !== 0 || b2bTotal !== 0 || intracomTotal !== 0) {
      countryChecks.push({
        country,
        regularTotal,
        b2cTotal,
        b2bTotal,
        intracomTotal,
        difference,
        isValid
      });
    }
  });
  
  return countryChecks.sort((a, b) => a.country.localeCompare(b.country));
}

/**
 * Statistiques sur l'application des règles selon spécifications YAML
 */
function calculateRulesStatistics(transactions: AmazonVATTransaction[]) {
  let ossRules = 0;
  let domesticB2CRules = 0;
  let domesticB2BRules = 0;
  let intracommunautaireRules = 0;
  let totalProcessed = 0;
  
  transactions.forEach(transaction => {
    const transactionType = (transaction['TRANSACTION_TYPE'] || '').toUpperCase().trim();
    if (!['SALES', 'REFUND'].includes(transactionType)) return;
    
    const amountSigned = transaction['AMOUNT_SIGNED'] || 0;
    if (amountSigned === 0) return;
    
    totalProcessed++;
    
    const ruleResult = applyVentilationRule(transaction);
    if (ruleResult) {
      switch (ruleResult.vatType) {
        case 'OSS':
          ossRules++;
          break;
        case 'DOMESTIC_B2C':
          domesticB2CRules++;
          break;
        case 'DOMESTIC_B2B':
          domesticB2BRules++;
          break;
        case 'INTRACOMMUNAUTAIRE':
          intracommunautaireRules++;
          break;
      }
    }
  });
  
  return {
    ossRules,
    domesticB2CRules,
    domesticB2BRules,
    intracommunautaireRules,
    totalProcessed
  };
}

/**
 * Normalisation des codes pays
 */
function normalizeCountryCode(countryString: string): string {
  const country = countryString.trim().toUpperCase();
  
  const countryMapping: { [key: string]: string } = {
    'GERMANY': 'DE', 'FRANCE': 'FR', 'ITALY': 'IT', 'SPAIN': 'ES',
    'NETHERLANDS': 'NL', 'POLAND': 'PL', 'SWEDEN': 'SE', 'BELGIUM': 'BE',
    'AUSTRIA': 'AT', 'CZECH REPUBLIC': 'CZ', 'CZECHIA': 'CZ', 'DENMARK': 'DK',
    'FINLAND': 'FI', 'GREECE': 'GR', 'HUNGARY': 'HU', 'IRELAND': 'IE',
    'LATVIA': 'LV', 'LITHUANIA': 'LT', 'LUXEMBOURG': 'LU', 'MALTA': 'MT',
    'PORTUGAL': 'PT', 'ROMANIA': 'RO', 'SLOVAKIA': 'SK', 'SLOVENIA': 'SI',
    'ESTONIA': 'EE', 'BULGARIA': 'BG', 'CROATIA': 'HR', 'CYPRUS': 'CY'
  };
  
  // Si c'est déjà un code à 2 lettres valide
  if (country.length === 2 && EU_COUNTRIES.includes(country)) {
    return country;
  }
  
  // Sinon chercher dans le mapping
  return countryMapping[country] || country;
}

/**
 * Parser CSV Amazon
 */
function parseAmazonCSV(csvContent: string): AmazonVATTransaction[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Gérer les fichiers avec BOM UTF-8
  const firstLine = lines[0].replace(/^\uFEFF/, '');
  const headers = parseCSVLine(firstLine);
  const transactions: AmazonVATTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const transaction: AmazonVATTransaction = {};
    
    headers.forEach((header, index) => {
      transaction[header] = values[index] || '';
    });
    
    transactions.push(transaction);
  }

  return transactions;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] === ',')) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}