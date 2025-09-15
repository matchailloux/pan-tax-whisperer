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
  // Helpers
  const normalizeTxType = (val: string): 'SALE' | 'REFUND' | '' => {
    const t = (val || '').toUpperCase().trim();
    if (t === 'SALE' || t === 'SALES' || t === 'VENTE') return 'SALE';
    if (t === 'REFUND' || t === 'REFUNDS' || t === 'REMBOURSEMENT' || t === 'RETURN' || t === 'CREDIT' || t === 'CREDIT_NOTE') return 'REFUND';
    return '';
  };

  const normalizeScheme = (val: string): string => {
    const s = (val || '').toUpperCase().trim().replace(/\s+/g, '-');
    if (['UNION-OSS', 'EU-OSS', 'OSS'].includes(s)) return 'UNION-OSS';
    if (['REGULAR', 'DOMESTIC', 'LOCAL'].includes(s)) return 'REGULAR';
    if (['CH-VOEC', 'CH_VOEC', 'VOEC'].includes(s)) return 'CH_VOEC';
    return s;
  };

  const emptyValues = ["", "(VIDE)", "(VIDES)", "NULL", "N/A", "-", "—", "NONE", " "];

  const parseAmount = (raw: any): number => {
    if (typeof raw === 'number') return raw;
    if (typeof raw !== 'string') return 0;
    let s = raw.trim().replace(/\s/g, '').replace(/[€$£¥]/g, '');
    const hasComma = s.includes(',');
    const hasDot = s.includes('.');
    if (hasComma && hasDot) {
      const lastComma = s.lastIndexOf(',');
      const lastDot = s.lastIndexOf('.');
      if (lastComma > lastDot) {
        // EU style: 1.234,56 -> 1234.56
        s = s.replace(/\./g, '');
        s = s.replace(/,/g, '.');
      } else {
        // US style: 1,234.56 -> 1234.56
        s = s.replace(/,/g, '');
      }
    } else if (hasComma) {
      // Only comma -> treat as decimal
      s = s.replace(/,/g, '.');
    }
    s = s.replace(/[^0-9.-]/g, '');
    const num = parseFloat(s);
    return isNaN(num) ? 0 : num;
  };

  const mapCountry = (c: string): string => normalizeCountryCode((c || '').toString().trim());

  // Variantes d'en-têtes (après normalisation en MAJ+_)
  const getFirst = (obj: any, keys: string[], def: any = '') => {
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        const v = obj[k];
        if (v !== undefined && v !== null && `${v}`.trim() !== '') return v;
      }
    }
    return def;
  };

  const txTypeKeys = ['TRANSACTION_TYPE','TRANSACTIONTYPE','TX_TYPE','TYPE','TRANSACTION','TYPE_TRANSACTION'];
  const schemeKeys = ['TAX_REPORTING_SCHEME','TAX_REPORTING','REPORTING_SCHEME','VAT_REPORTING_SCHEME','SCHEME'];
  const arrivalKeys = ['SALE_ARRIVAL_COUNTRY','ARRIVAL_COUNTRY','ARRIVAL','SHIP_TO_COUNTRY','SHIP_TO','DESTINATION_COUNTRY'];
  const departKeys = ['SALE_DEPART_COUNTRY','DEPART_COUNTRY','DEPART','SHIP_FROM_COUNTRY','SHIP_FROM','ORIGIN_COUNTRY'];
  const buyerVatKeys = ['BUYER_VAT_NUMBER_COUNTRY','BUYER_VAT_COUNTRY','BUYER_VAT','VAT_NUMBER_COUNTRY','VAT_BUYER_COUNTRY','BUYER_VAT_NUMBER_PREFIX'];
  const amountKeys = ['TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL','TOTAL_ACTIVITY_VALUE_VAT_EXCL','TOTAL_ACTIVITY_VALUE','TOTAL_VAT_EXCL','AMOUNT_VAT_EXCL','AMOUNT','NET_AMOUNT','ITEM_PRICE_EXCL_VAT','TRANSACTION_AMOUNT'];

  const mapped: ProcessedTransaction[] = rawTransactions.map(transaction => {
    const txType = normalizeTxType(getFirst(transaction, txTypeKeys, ''));
    const scheme = normalizeScheme(getFirst(transaction, schemeKeys, ''));
    const arrival = mapCountry(getFirst(transaction, arrivalKeys, ''));
    const depart = mapCountry(getFirst(transaction, departKeys, ''));
    let buyerVat = (getFirst(transaction, buyerVatKeys, '') || '').toString().trim().toUpperCase();
    if (emptyValues.includes(buyerVat)) buyerVat = '';
    buyerVat = mapCountry(buyerVat) || '';

    const amount = parseAmount(getFirst(transaction, amountKeys, ''));
    const amountSigned = txType === 'REFUND' ? -Math.abs(amount) : Math.abs(amount);

    return {
      TX_TYPE: txType,
      SCHEME: scheme,
      ARRIVAL: arrival,
      DEPART: depart,
      BUYER_VAT: buyerVat,
      AMOUNT_RAW: amount,
      AMOUNT_SIGNED: amountSigned
    } as ProcessedTransaction;
  })
  // Étape 2: Ne garder que SALE / REFUND (après normalisation robuste)
  .filter(t => t.TX_TYPE === 'SALE' || t.TX_TYPE === 'REFUND');

  console.log(`🔧 ${mapped.length} transactions après preprocessing YAML`);
  return mapped;
}

/**
 * Normalisation des codes pays (vers codes ISO-2)
 */
function normalizeCountryCode(countryString: string): string {
  const country = (countryString || '').trim().toUpperCase();
  const mapping: { [key: string]: string } = {
    'GERMANY': 'DE', 'FRANCE': 'FR', 'ITALY': 'IT', 'SPAIN': 'ES', 'NETHERLANDS': 'NL', 'POLAND': 'PL', 'SWEDEN': 'SE', 'BELGIUM': 'BE',
    'AUSTRIA': 'AT', 'CZECH REPUBLIC': 'CZ', 'CZECHIA': 'CZ', 'DENMARK': 'DK', 'FINLAND': 'FI', 'GREECE': 'GR', 'HUNGARY': 'HU', 'IRELAND': 'IE',
    'LATVIA': 'LV', 'LITHUANIA': 'LT', 'LUXEMBOURG': 'LU', 'MALTA': 'MT', 'PORTUGAL': 'PT', 'ROMANIA': 'RO', 'SLOVAKIA': 'SK', 'SLOVENIA': 'SI',
    'ESTONIA': 'EE', 'BULGARIA': 'BG', 'CROATIA': 'HR', 'CYPRUS': 'CY', 'SWITZERLAND': 'CH', 'UNITED KINGDOM': 'GB', 'UK': 'GB'
  };
  if (country.length === 2) return country;
  return mapping[country] || country;
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
  
  const rawHeaders = parseCSVLine(firstLine, delimiter);
  const normalizeHeader = (h: string) =>
    h
      .replace(/^\uFEFF/, '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/__+/g, '_')
      .replace(/^_|_$/g, '');
  const headers = rawHeaders.map(normalizeHeader);
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