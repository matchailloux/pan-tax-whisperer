/**
 * Moteur de règles TVA basé sur les spécifications YAML v1
 * Implémente preprocessing avancé, règles de ventilation complètes et KPI cards
 * Inclut OSS, B2C, B2B, Intracommunautaire, Suisse (VOEC) et Autre
 */

export interface VATRuleData {
  country: string;
  oss: number;
  domesticB2C: number;
  domesticB2B: number;
  intracommunautaire: number;
  suisse: number;
  residuel: number;
  total: number;
}

export interface VATMetrics {
  amount: number;
  count: number;
}

export interface VATKPICard {
  title: string;
  amount: number;
  count: number;
}

export interface SanityCheckGlobal {
  grandTotal: number;
  ossTotal: number;
  regularTotal: number;
  suisseTotal: number;
  residuTotal: number;
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
  kpiCards: VATKPICard[];
  sanityCheckGlobal: SanityCheckGlobal;
  sanityCheckByCountry: SanityCheckByCountry[];
  rulesApplied: {
    ossRules: number;
    domesticB2CRules: number;
    domesticB2BRules: number;
    intracommunautaireRules: number;
    suisseRules: number;
    residuelRules: number;
    totalProcessed: number;
  };
}

export interface ProcessedVATTransaction {
  TX_TYPE?: string;
  SCHEME?: string;
  ARRIVAL?: string;
  DEPART?: string;
  BUYER_VAT?: string;
  AMOUNT_RAW?: number;
  AMOUNT_SIGNED?: number;
  [key: string]: string | number | undefined;
}

const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

/**
 * Moteur principal de traitement du rapport Amazon VAT selon spécifications YAML v1
 */
export function processVATWithNewRules(csvContent: string): DetailedVATReport {
  console.log('🚀 Démarrage du moteur TVA YAML v1');
  
  // Étape 1: Parser le CSV
  let transactions = parseAmazonCSV(csvContent);
  console.log(`📊 ${transactions.length} transactions parsées`);
  
  // Étape 2: Preprocessing selon les spécifications YAML v1
  transactions = preprocessTransactions(transactions);
  console.log(`🔧 ${transactions.length} transactions après preprocessing`);
  
  // Étape 3: Appliquer les règles de ventilation
  const breakdown = applyVATVentilationRules(transactions);
  console.log(`📈 ${breakdown.length} pays dans la ventilation`);
  
  // Étape 4: Générer les KPI Cards
  const kpiCards = generateKPICards(transactions);
  
  // Étape 5: Sanity checks globaux
  const sanityCheckGlobal = performGlobalSanityCheck(transactions, breakdown);
  
  // Étape 6: Sanity checks par pays
  const sanityCheckByCountry = performCountrySanityCheck(transactions, breakdown);
  
  // Étape 7: Statistiques des règles appliquées
  const rulesApplied = calculateRulesStatistics(transactions);
  
  console.log('✅ Moteur de règles TVA YAML v1 terminé:', {
    transactions: transactions.length,
    pays: breakdown.length,
    sanityGlobal: sanityCheckGlobal.isValid ? '✅ Valide' : '❌ Erreur',
    sanityPays: sanityCheckByCountry.filter(c => !c.isValid).length === 0 ? '✅ Valide' : '❌ Erreurs détectées'
  });
  
  return {
    breakdown,
    kpiCards,
    sanityCheckGlobal,
    sanityCheckByCountry,
    rulesApplied
  };
}

/**
 * Preprocessing des données selon les spécifications YAML v1
 */
function preprocessTransactions(rawTransactions: any[]): ProcessedVATTransaction[] {
  return rawTransactions
    .filter(transaction => {
      // Étape 2: Ne garder que SALE/SALES/REFUND
      const txType = (transaction['TRANSACTION_TYPE'] || '').toUpperCase().trim();
      return ['SALE', 'SALES', 'REFUND'].includes(txType);
    })
    .map(transaction => {
      const processed: ProcessedVATTransaction = {};

      // Étape 3: Renommer les colonnes pour simplifier
      processed.TX_TYPE = (transaction['TRANSACTION_TYPE'] || '').trim().toUpperCase();
      processed.SCHEME = (transaction['TAX_REPORTING_SCHEME'] || '').trim();
      processed.ARRIVAL = (transaction['SALE_ARRIVAL_COUNTRY'] || '').trim();
      processed.DEPART = (transaction['SALE_DEPART_COUNTRY'] || '').trim();
      processed.BUYER_VAT = (transaction['BUYER_VAT_NUMBER_COUNTRY'] || '').trim();
      
      // Étape 4: Normaliser les vides pour BUYER_VAT
      const emptyValues = ['', '(VIDE)', '(VIDES)', 'NULL', 'N/A', '-', '—', 'NONE', ' '];
      if (emptyValues.includes(processed.BUYER_VAT || '')) {
        processed.BUYER_VAT = '';
      }
      
      // Étape 5: Uniformiser les codes pays (uppercase)
      processed.ARRIVAL = (processed.ARRIVAL || '').toUpperCase();
      processed.DEPART = (processed.DEPART || '').toUpperCase();
      processed.BUYER_VAT = (processed.BUYER_VAT || '').toUpperCase();
      
      // Normaliser les schémas
      const schemeMapping: { [key: string]: string } = {
        'Union-OSS': 'UNION-OSS',
        'union-oss': 'UNION-OSS',
        'Regular': 'REGULAR',
        'regular': 'REGULAR'
      };
      if (processed.SCHEME && schemeMapping[processed.SCHEME]) {
        processed.SCHEME = schemeMapping[processed.SCHEME];
      }
      
      // Étape 6: Assainir les montants
      const rawAmount = transaction['TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL'];
      let amount = 0;
      
      if (typeof rawAmount === 'string' && rawAmount) {
        const cleanedAmount = rawAmount
          .replace(/,/g, '.') // Remplacer virgules par points
          .replace(/[€$£¥]/g, '') // Supprimer symboles monétaires
          .replace(/[^\d.-]/g, ''); // Supprimer autres caractères
        amount = parseFloat(cleanedAmount) || 0;
      } else if (typeof rawAmount === 'number') {
        amount = rawAmount;
      }
      
      processed.AMOUNT_RAW = amount;
      
      // Étape 7: Créer AMOUNT_SIGNED (refunds en négatif)
      if (processed.TX_TYPE === 'REFUND') {
        processed.AMOUNT_SIGNED = -Math.abs(amount);
      } else {
        processed.AMOUNT_SIGNED = amount;
      }
      
      return processed;
    });
}

/**
 * Application des règles de ventilation TVA selon les spécifications YAML v1
 */
function applyVATVentilationRules(transactions: ProcessedVATTransaction[]): VATRuleData[] {
  const countryBreakdown: { [country: string]: VATRuleData } = {};
  
  // Classer les transactions selon les 6 catégories
  const classifiedTransactions = transactions.map(transaction => {
    const classification = classifyTransaction(transaction);
    return { transaction, classification };
  });
  
  // Ventiler par pays et catégorie
  classifiedTransactions.forEach(({ transaction, classification }) => {
    if (!classification) return;
    
    const { country, vatType } = classification;
    const amountSigned = transaction.AMOUNT_SIGNED || 0;
    
    // Initialiser le pays s'il n'existe pas
    if (!countryBreakdown[country]) {
      countryBreakdown[country] = {
        country,
        oss: 0,
        domesticB2C: 0,
        domesticB2B: 0,
        intracommunautaire: 0,
        suisse: 0,
        residuel: 0,
        total: 0
      };
    }
    
    // Ventiler selon le type de TVA
    switch (vatType) {
      case 'OSS':
        countryBreakdown[country].oss += amountSigned;
        break;
      case 'DOMESTIC_B2C':
        countryBreakdown[country].domesticB2C += amountSigned;
        break;
      case 'DOMESTIC_B2B':
        countryBreakdown[country].domesticB2B += amountSigned;
        break;
      case 'INTRACOMMUNAUTAIRE':
        countryBreakdown[country].intracommunautaire += amountSigned;
        break;
      case 'SUISSE':
        countryBreakdown[country].suisse += amountSigned;
        break;
      case 'RESIDUEL':
        countryBreakdown[country].residuel += amountSigned;
        break;
    }
    
    countryBreakdown[country].total += amountSigned;
  });
  
  return Object.values(countryBreakdown).sort((a, b) => a.country.localeCompare(b.country));
}

interface VentilationResult {
  country: string;
  vatType: 'OSS' | 'DOMESTIC_B2C' | 'DOMESTIC_B2B' | 'INTRACOMMUNAUTAIRE' | 'SUISSE' | 'RESIDUEL';
}

/**
 * Classifie une transaction selon les règles YAML v1
 */
function classifyTransaction(transaction: ProcessedVATTransaction): VentilationResult | null {
  const scheme = (transaction.SCHEME || '').toUpperCase().trim();
  const arrival = normalizeCountryCode(transaction.ARRIVAL || '');
  const depart = normalizeCountryCode(transaction.DEPART || '');
  const buyerVat = normalizeCountryCode(transaction.BUYER_VAT || '');
  
  // 1) OSS (UNION-OSS)
  if (scheme === 'UNION-OSS' && arrival) {
    return { country: arrival, vatType: 'OSS' };
  }
  
  // 2) Domestique B2C (REGULAR + acheteur sans TVA)
  if (scheme === 'REGULAR' && depart && (!buyerVat || buyerVat === '')) {
    return { country: depart, vatType: 'DOMESTIC_B2C' };
  }
  
  // 3) Domestique B2B (vendeur = acheteur même pays)
  if (scheme === 'REGULAR' && depart && buyerVat && buyerVat === depart) {
    return { country: depart, vatType: 'DOMESTIC_B2B' };
  }
  
  // 4) Intracommunautaire (vendeur ≠ acheteur ≠ vide)
  if (scheme === 'REGULAR' && depart && buyerVat && buyerVat !== depart) {
    return { country: depart, vatType: 'INTRACOMMUNAUTAIRE' };
  }
  
  // 5) Suisse (CH_VOEC)
  if (scheme === 'CH_VOEC' && arrival) {
    return { country: arrival, vatType: 'SUISSE' };
  }
  
  // 6) Autre (tout le reste)
  const fallbackCountry = depart || arrival || 'UNKNOWN';
  if (fallbackCountry !== 'UNKNOWN') {
    return { country: fallbackCountry, vatType: 'RESIDUEL' };
  }
  
  return null;
}

/**
 * Génère les KPI Cards selon les spécifications YAML v1
 */
function generateKPICards(transactions: ProcessedVATTransaction[]): VATKPICard[] {
  const kpis: VATKPICard[] = [];
  
  // Total général
  const grandTotal = transactions.reduce((sum, t) => sum + (t.AMOUNT_SIGNED || 0), 0);
  const grandCount = transactions.length;
  kpis.push({ title: 'Total général', amount: grandTotal, count: grandCount });
  
  // Par catégorie
  const categories = [
    { title: 'OSS', filter: (t: ProcessedVATTransaction) => t.SCHEME === 'UNION-OSS' },
    { title: 'Domestique B2C', filter: (t: ProcessedVATTransaction) => t.SCHEME === 'REGULAR' && (!t.BUYER_VAT || t.BUYER_VAT === '') },
    { title: 'Domestique B2B', filter: (t: ProcessedVATTransaction) => t.SCHEME === 'REGULAR' && t.BUYER_VAT && t.BUYER_VAT === t.DEPART },
    { title: 'Intracommunautaire', filter: (t: ProcessedVATTransaction) => t.SCHEME === 'REGULAR' && t.BUYER_VAT && t.BUYER_VAT !== t.DEPART },
    { title: 'Suisse (VOEC)', filter: (t: ProcessedVATTransaction) => t.SCHEME === 'CH_VOEC' }
  ];
  
  categories.forEach(category => {
    const filtered = transactions.filter(category.filter);
    const amount = filtered.reduce((sum, t) => sum + (t.AMOUNT_SIGNED || 0), 0);
    const count = filtered.length;
    kpis.push({ title: category.title, amount, count });
  });
  
  // Autre (transactions non classifiées dans les 5 catégories principales)
  const classifiedCount = categories.reduce((sum, cat) => sum + transactions.filter(cat.filter).length, 0);
  const residuelCount = transactions.length - classifiedCount;
  const residuelAmount = grandTotal - categories.reduce((sum, cat) => {
    return sum + transactions.filter(cat.filter).reduce((catSum, t) => catSum + (t.AMOUNT_SIGNED || 0), 0);
  }, 0);
  kpis.push({ title: 'Autre', amount: residuelAmount, count: residuelCount });
  
  return kpis;
}

/**
 * Sanity checks globaux selon spécifications YAML v1
 */
function performGlobalSanityCheck(transactions: ProcessedVATTransaction[], breakdown: VATRuleData[]): SanityCheckGlobal {
  // Grand total
  const grandTotal = transactions.reduce((sum, t) => sum + (t.AMOUNT_SIGNED || 0), 0);
  
  // OSS Total
  const ossTotal = transactions
    .filter(t => t.SCHEME === 'UNION-OSS')
    .reduce((sum, t) => sum + (t.AMOUNT_SIGNED || 0), 0);
  
  // REGULAR Total  
  const regularTotal = transactions
    .filter(t => t.SCHEME === 'REGULAR')
    .reduce((sum, t) => sum + (t.AMOUNT_SIGNED || 0), 0);
  
  // Suisse Total
  const suisseTotal = transactions
    .filter(t => t.SCHEME === 'CH_VOEC')
    .reduce((sum, t) => sum + (t.AMOUNT_SIGNED || 0), 0);
  
  // Totaux des composants depuis breakdown
  const b2cTotal = breakdown.reduce((sum, item) => sum + item.domesticB2C, 0);
  const b2bTotal = breakdown.reduce((sum, item) => sum + item.domesticB2B, 0);
  const intracomTotal = breakdown.reduce((sum, item) => sum + item.intracommunautaire, 0);
  const residuTotal = breakdown.reduce((sum, item) => sum + item.residuel, 0);
  
  // Calculs de différence
  const diffGrandTotalVsSum = grandTotal - (ossTotal + regularTotal + suisseTotal + residuTotal);
  const diffRegularVsComponents = regularTotal - (b2cTotal + b2bTotal + intracomTotal);
  
  const isValid = Math.abs(diffGrandTotalVsSum) < 0.01 && Math.abs(diffRegularVsComponents) < 0.01;
  
  return {
    grandTotal,
    ossTotal,
    regularTotal,
    suisseTotal,
    residuTotal,
    b2cTotal,
    b2bTotal,
    intracomTotal,
    diffGrandTotalVsSum,
    diffRegularVsComponents,
    isValid
  };
}

/**
 * Sanity checks par pays selon spécifications YAML v1
 */
function performCountrySanityCheck(transactions: ProcessedVATTransaction[], breakdown: VATRuleData[]): SanityCheckByCountry[] {
  const countryChecks: SanityCheckByCountry[] = [];
  
  // Obtenir tous les pays DEPART
  const countries = new Set<string>();
  transactions.forEach(t => {
    const country = normalizeCountryCode(t.DEPART || '');
    if (country) countries.add(country);
  });
  
  countries.forEach(country => {
    // REGULAR total pour ce pays
    const regularTotal = transactions
      .filter(t => t.SCHEME === 'REGULAR' && normalizeCountryCode(t.DEPART || '') === country)
      .reduce((sum, t) => sum + (t.AMOUNT_SIGNED || 0), 0);
    
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
 * Statistiques sur l'application des règles selon spécifications YAML v1
 */
function calculateRulesStatistics(transactions: ProcessedVATTransaction[]) {
  let ossRules = 0;
  let domesticB2CRules = 0;
  let domesticB2BRules = 0;
  let intracommunautaireRules = 0;
  let suisseRules = 0;
  let residuelRules = 0;
  
  transactions.forEach(transaction => {
    const classification = classifyTransaction(transaction);
    if (classification) {
      switch (classification.vatType) {
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
        case 'SUISSE':
          suisseRules++;
          break;
        case 'RESIDUEL':
          residuelRules++;
          break;
      }
    }
  });
  
  return {
    ossRules,
    domesticB2CRules,
    domesticB2BRules,
    intracommunautaireRules,
    suisseRules,
    residuelRules,
    totalProcessed: transactions.length
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
function parseAmazonCSV(csvContent: string): any[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Gérer les fichiers avec BOM UTF-8
  const firstLine = lines[0].replace(/^\uFEFF/, '');
  const headers = parseCSVLine(firstLine);
  const transactions: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const transaction: any = {};
    
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