/**
 * Moteur TVA selon spécifications YAML complètes
 * Implémente preprocessing, règles fiscales et rapports conformément au YAML fourni
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

interface ProcessedTransaction {
  TX_TYPE: string;
  SCHEME: string;
  ARRIVAL: string;
  DEPART: string;
  BUYER_VAT: string;
  AMOUNT_RAW: number;
  AMOUNT_SIGNED: number;
}

/**
 * Moteur principal selon les spécifications YAML
 */
export function processVATWithYAMLRules(csvContent: string): DetailedVATReport {
  console.log('🚀 Démarrage moteur TVA YAML complet');
  
  // Étape 1: Parser le CSV
  let transactions = parseCSV(csvContent);
  console.log(`📊 ${transactions.length} transactions parsées`);
  
  // Étape 2: Preprocessing selon YAML
  transactions = preprocessYAML(transactions);
  console.log(`🔧 ${transactions.length} transactions après preprocessing YAML`);
  
  // Étape 3: Appliquer les règles YAML
  const breakdown = applyYAMLRules(transactions);
  console.log(`📈 ${breakdown.length} pays dans la ventilation`);
  
  // Étape 4: Générer les KPI Cards selon YAML
  const kpiCards = generateYAMLKPIs(transactions);
  
  // Étape 5: Sanity checks globaux selon YAML
  const sanityCheckGlobal = performYAMLGlobalSanityCheck(transactions, breakdown);
  
  // Étape 6: Sanity checks par pays selon YAML
  const sanityCheckByCountry = performYAMLCountrySanityCheck(transactions, breakdown);
  
  // Étape 7: Statistiques des règles appliquées
  const rulesApplied = calculateYAMLRulesStatistics(transactions);
  
  console.log('✅ Moteur TVA YAML terminé:', {
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
 * Preprocessing selon les spécifications YAML
 */
function preprocessYAML(rawTransactions: any[]): ProcessedTransaction[] {
  return rawTransactions
    // Étape 2: Ne garder que SALE / REFUND exactement
    .filter(transaction => {
      const txType = (transaction['TRANSACTION_TYPE'] || '').toUpperCase().trim();
      return txType === 'SALE' || txType === 'REFUND';
    })
    .map(transaction => {
      // Étape 3: Renommer pour faciliter la suite
      const txType = (transaction['TRANSACTION_TYPE'] || '').trim().toUpperCase();
      const scheme = (transaction['TAX_REPORTING_SCHEME'] || '').trim();
      const arrival = (transaction['SALE_ARRIVAL_COUNTRY'] || '').trim();
      const depart = (transaction['SALE_DEPART_COUNTRY'] || '').trim();
      let buyerVat = (transaction['BUYER_VAT_NUMBER_COUNTRY'] || '').trim();
      
      // Étape 4: Normaliser les vides pour BUYER_VAT
      const emptyValues = ["", "(VIDE)", "(VIDES)", "NULL", "N/A", "-", "—", "NONE", " "];
      if (emptyValues.includes(buyerVat)) {
        buyerVat = '';
      }
      
      // Étape 5: Uniformiser les codes pays (uppercase)
      const arrivalUpper = arrival.toUpperCase();
      const departUpper = depart.toUpperCase();
      const buyerVatUpper = buyerVat.toUpperCase();
      
      // Étape 6: Assainir les montants
      const rawAmount = transaction['TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL'];
      let amount = 0;
      
      if (typeof rawAmount === 'string' && rawAmount) {
        const cleanedAmount = rawAmount
          .replace(/,/g, '.') // replace_decimal_comma
          .replace(/[€$£¥]/g, '') // strip_currency_symbols
          .replace(/[^\d.-]/g, ''); // remove_thousand_seps
        amount = parseFloat(cleanedAmount) || 0;
      } else if (typeof rawAmount === 'number') {
        amount = rawAmount;
      }
      
      // Étape 7: Créer AMOUNT_SIGNED (refunds en négatif)
      const amountSigned = txType === 'REFUND' ? -Math.abs(amount) : amount;
      
      return {
        TX_TYPE: txType,
        SCHEME: scheme,
        ARRIVAL: arrivalUpper,
        DEPART: departUpper,
        BUYER_VAT: buyerVatUpper,
        AMOUNT_RAW: amount,
        AMOUNT_SIGNED: amountSigned
      };
    });
}

/**
 * Application des règles YAML avec opérateurs is_empty, is_not_empty, value_from, exclude_rules
 */
function applyYAMLRules(transactions: ProcessedTransaction[]): VATRuleData[] {
  const countryBreakdown: { [country: string]: VATRuleData } = {};
  
  // Classer les transactions selon les règles YAML
  transactions.forEach(transaction => {
    const classification = classifyTransactionYAML(transaction);
    if (!classification) return;
    
    const { country, vatType } = classification;
    const amountSigned = transaction.AMOUNT_SIGNED;
    
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

interface VentilationYAMLResult {
  country: string;
  vatType: 'OSS' | 'DOMESTIC_B2C' | 'DOMESTIC_B2B' | 'INTRACOMMUNAUTAIRE' | 'SUISSE' | 'RESIDUEL';
}

/**
 * Classification selon les règles YAML exactes
 */
function classifyTransactionYAML(transaction: ProcessedTransaction): VentilationYAMLResult | null {
  const scheme = transaction.SCHEME;
  const arrival = transaction.ARRIVAL;
  const depart = transaction.DEPART;
  const buyerVat = transaction.BUYER_VAT;
  
  // 1) OSS (UNION-OSS)
  if (scheme === 'UNION-OSS' && arrival) {
    return { country: arrival, vatType: 'OSS' };
  }
  
  // 2) Domestique B2C (REGULAR + acheteur sans TVA)
  // operator: "is_empty" pour BUYER_VAT
  if (scheme === 'REGULAR' && depart && isEmptyYAML(buyerVat)) {
    return { country: depart, vatType: 'DOMESTIC_B2C' };
  }
  
  // 3) Domestique B2B (vendeur = acheteur même pays)
  // operator: "=", value_from: "DEPART" pour BUYER_VAT
  if (scheme === 'REGULAR' && depart && buyerVat && buyerVat === depart) {
    return { country: depart, vatType: 'DOMESTIC_B2B' };
  }
  
  // 4) Intracommunautaire (vendeur ≠ acheteur ≠ vide)
  // operator: "!=", value_from: "DEPART" ET operator: "is_not_empty"
  if (scheme === 'REGULAR' && depart && buyerVat && buyerVat !== depart && isNotEmptyYAML(buyerVat)) {
    return { country: depart, vatType: 'INTRACOMMUNAUTAIRE' };
  }
  
  // 5) Suisse (VOEC)
  if (scheme === 'CH_VOEC' && arrival) {
    return { country: arrival, vatType: 'SUISSE' };
  }
  
  // 6) Autre / Résidu (tout ce qui n'entre dans aucune des 5 catégories ci-dessus)
  // exclude_rules: ["oss_total","b2c_total","b2b_dom_total","intra_total","suisse_total"]
  const fallbackCountry = depart || arrival || 'UNKNOWN';
  if (fallbackCountry !== 'UNKNOWN') {
    return { country: fallbackCountry, vatType: 'RESIDUEL' };
  }
  
  return null;
}

/**
 * Opérateur is_empty selon YAML
 */
function isEmptyYAML(value: string): boolean {
  return !value || value === '';
}

/**
 * Opérateur is_not_empty selon YAML
 */
function isNotEmptyYAML(value: string): boolean {
  return value && value !== '';
}

/**
 * Génération des KPI Cards selon YAML
 */
function generateYAMLKPIs(transactions: ProcessedTransaction[]): VATKPICard[] {
  const kpis: VATKPICard[] = [];
  
  // KPI Cards selon YAML
  const kpiDefs = [
    {
      title: 'Total général',
      filter: () => true
    },
    {
      title: 'OSS',
      filter: (t: ProcessedTransaction) => t.SCHEME === 'UNION-OSS'
    },
    {
      title: 'Domestique B2C',
      filter: (t: ProcessedTransaction) => t.SCHEME === 'REGULAR' && isEmptyYAML(t.BUYER_VAT)
    },
    {
      title: 'Domestique B2B',
      filter: (t: ProcessedTransaction) => t.SCHEME === 'REGULAR' && t.BUYER_VAT && t.BUYER_VAT === t.DEPART
    },
    {
      title: 'Intracommunautaire',
      filter: (t: ProcessedTransaction) => t.SCHEME === 'REGULAR' && t.BUYER_VAT && t.BUYER_VAT !== t.DEPART && isNotEmptyYAML(t.BUYER_VAT)
    },
    {
      title: 'Suisse (VOEC)',
      filter: (t: ProcessedTransaction) => t.SCHEME === 'CH_VOEC'
    }
  ];
  
  // Calculer chaque KPI
  kpiDefs.forEach(kpiDef => {
    const filtered = transactions.filter(kpiDef.filter);
    const amount = filtered.reduce((sum, t) => sum + t.AMOUNT_SIGNED, 0);
    const count = filtered.length;
    kpis.push({ title: kpiDef.title, amount, count });
  });
  
  // Autre / Résidu (exclude_rules des 5 autres)
  const classifiedCount = kpiDefs.slice(1).reduce((sum, kpiDef) => 
    sum + transactions.filter(kpiDef.filter).length, 0
  );
  const residuelCount = transactions.length - classifiedCount;
  const residuelAmount = transactions.reduce((sum, t) => sum + t.AMOUNT_SIGNED, 0) - 
    kpiDefs.slice(1).reduce((sum, kpiDef) => 
      sum + transactions.filter(kpiDef.filter).reduce((catSum, t) => catSum + t.AMOUNT_SIGNED, 0), 0
    );
  
  kpis.push({ title: 'Autre / Résidu', amount: residuelAmount, count: residuelCount });
  
  return kpis;
}

/**
 * Sanity checks globaux selon YAML
 */
function performYAMLGlobalSanityCheck(transactions: ProcessedTransaction[], breakdown: VATRuleData[]): SanityCheckGlobal {
  // Grand total
  const grandTotal = transactions.reduce((sum, t) => sum + t.AMOUNT_SIGNED, 0);
  
  // OSS Total
  const ossTotal = transactions
    .filter(t => t.SCHEME === 'UNION-OSS')
    .reduce((sum, t) => sum + t.AMOUNT_SIGNED, 0);
  
  // REGULAR Total  
  const regularTotal = transactions
    .filter(t => t.SCHEME === 'REGULAR')
    .reduce((sum, t) => sum + t.AMOUNT_SIGNED, 0);
  
  // Suisse Total
  const suisseTotal = transactions
    .filter(t => t.SCHEME === 'CH_VOEC')
    .reduce((sum, t) => sum + t.AMOUNT_SIGNED, 0);
  
  // Totaux des composants depuis breakdown
  const b2cTotal = breakdown.reduce((sum, item) => sum + item.domesticB2C, 0);
  const b2bTotal = breakdown.reduce((sum, item) => sum + item.domesticB2B, 0);
  const intracomTotal = breakdown.reduce((sum, item) => sum + item.intracommunautaire, 0);
  const residuTotal = breakdown.reduce((sum, item) => sum + item.residuel, 0);
  
  // Calculs de différence selon YAML
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
 * Sanity checks par pays selon YAML
 */
function performYAMLCountrySanityCheck(transactions: ProcessedTransaction[], breakdown: VATRuleData[]): SanityCheckByCountry[] {
  const countryChecks: SanityCheckByCountry[] = [];
  
  // Obtenir tous les pays DEPART
  const countries = new Set<string>();
  transactions.forEach(t => {
    if (t.DEPART) countries.add(t.DEPART);
  });
  
  countries.forEach(country => {
    // REGULAR total pour ce pays
    const regularTotal = transactions
      .filter(t => t.SCHEME === 'REGULAR' && t.DEPART === country)
      .reduce((sum, t) => sum + t.AMOUNT_SIGNED, 0);
    
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
 * Statistiques sur l'application des règles YAML
 */
function calculateYAMLRulesStatistics(transactions: ProcessedTransaction[]) {
  let ossRules = 0;
  let domesticB2CRules = 0;
  let domesticB2BRules = 0;
  let intracommunautaireRules = 0;
  let suisseRules = 0;
  let residuelRules = 0;
  
  transactions.forEach(transaction => {
    const classification = classifyTransactionYAML(transaction);
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
 * Parser CSV avec détection automatique de délimiteur
 */
function detectDelimiter(sample: string): string {
  const comma = (sample.match(/,/g) || []).length;
  const semicolon = (sample.match(/;/g) || []).length;
  const tab = (sample.match(/\t/g) || []).length;
  if (semicolon >= comma && semicolon >= tab) return ';';
  if (tab >= comma && tab >= semicolon) return '\t';
  return ',';
}

function parseCSV(csvContent: string): any[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const firstLine = lines[0].replace(/^\uFEFF/, '');
  const delimiter = detectDelimiter(firstLine);
  console.log(`🧭 Délimiteur détecté: "${delimiter === '\t' ? 'TAB' : delimiter}"`);
  
  const headers = parseCSVLine(firstLine, delimiter);
  const transactions: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    const transaction: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index] ?? '';
      transaction[header] = typeof value === 'string' ? value.trim() : value;
    });
    
    transactions.push(transaction);
  }

  return transactions;
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] === delimiter)) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === delimiter)) {
      inQuotes = false;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}