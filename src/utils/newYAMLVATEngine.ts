// Types pour le moteur TVA YAML
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

export interface DetailedVATReport {
  breakdown: VATRuleData[];
  kpiCards: VATKPICard[];
  sanityCheckGlobal: {
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
  };
  sanityCheckByCountry: any[];
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

// Configuration YAML intégrée
const VAT_CONFIG_YAML = `
version: 1
name: TVA_Amazon (Signed Amounts + Résidu)

# ============================================
# PRE-PROCESSING — normalisation & montant signé
# ============================================
preprocessing:
  steps:
    # 1) Ne garder que les colonnes utiles
    - type: drop_columns_except
      columns:
        - TRANSACTION_TYPE
        - TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL
        - TAX_REPORTING_SCHEME
        - SALE_ARRIVAL_COUNTRY
        - SALE_DEPART_COUNTRY
        - BUYER_VAT_NUMBER_COUNTRY

    # 2) Ne garder que SALE / REFUND (⚠️ "SALE" pas "SALES")
    - type: filter
      column: TRANSACTION_TYPE
      operator: in
      value: ["SALE","REFUND"]

    # 3) Renommer pour faciliter la suite
    - type: rename_columns
      mapping:
        TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL: AMOUNT_RAW
        TAX_REPORTING_SCHEME: SCHEME
        SALE_ARRIVAL_COUNTRY: ARRIVAL
        SALE_DEPART_COUNTRY: DEPART
        BUYER_VAT_NUMBER_COUNTRY: BUYER_VAT
        TRANSACTION_TYPE: TX_TYPE

    # 4) Normaliser les vides (B2C)
    - type: normalize_empty
      columns: ["BUYER_VAT"]
      empty_values: ["", "(VIDE)", "(VIDES)", "NULL", "N/A", "-", "—", "NONE", " "]

    # 5) Uniformiser les codes pays
    - type: uppercase
      columns: ["ARRIVAL","DEPART","BUYER_VAT"]

    # 6) Assainir les montants
    - type: to_number
      column: AMOUNT_RAW
      options:
        replace_decimal_comma: true
        remove_thousand_seps: true
        strip_currency_symbols: true

    # 7) Créer AMOUNT_SIGNED (refunds en négatif)
    - type: compute
      as: AMOUNT_SIGNED
      formula:
        when:
          - if:   { column: TX_TYPE, operator: "=", value: "REFUND" }
            then: NEGATE("AMOUNT_RAW")
        else: VALUE("AMOUNT_RAW")

# ============================================
# RÈGLES — ventilation fiscale
# ============================================
rules:

  # 1) OSS (UNION-OSS)
  - id: oss_total
    label: "OSS - Total"
    filters:
      - { column: SCHEME, operator: "=", value: "UNION-OSS" }
    aggregations:
      - { column: AMOUNT_SIGNED, function: SUM }
      - { column: AMOUNT_SIGNED, function: COUNT }

  - id: oss_by_country
    label: "OSS - Par pays (arrivée)"
    filters:
      - { column: SCHEME, operator: "=", value: "UNION-OSS" }
    group_by: ["ARRIVAL"]
    aggregation: { column: AMOUNT_SIGNED, function: SUM }

  # 2) Domestique B2C (REGULAR + acheteur sans TVA)
  - id: b2c_total
    label: "Domestique B2C - Total"
    filters:
      - { column: SCHEME, operator: "=", value: "REGULAR" }
      - { column: BUYER_VAT, operator: "is_empty" }
    aggregations:
      - { column: AMOUNT_SIGNED, function: SUM }
      - { column: AMOUNT_SIGNED, function: COUNT }

  - id: b2c_by_country
    label: "Domestique B2C - Par pays (départ)"
    filters:
      - { column: SCHEME, operator: "=", value: "REGULAR" }
      - { column: BUYER_VAT, operator: "is_empty" }
    group_by: ["DEPART"]
    aggregation: { column: AMOUNT_SIGNED, function: SUM }

  # 3) Domestique B2B (vend. = achet. même pays)
  - id: b2b_dom_total
    label: "Domestique B2B - Total"
    filters:
      - { column: SCHEME, operator: "=", value: "REGULAR" }
      - { column: BUYER_VAT, operator: "=", value_from: "DEPART" }
    aggregations:
      - { column: AMOUNT_SIGNED, function: SUM }
      - { column: AMOUNT_SIGNED, function: COUNT }

  - id: b2b_dom_by_country
    label: "Domestique B2B - Par pays (départ)"
    filters:
      - { column: SCHEME, operator: "=", value: "REGULAR" }
      - { column: BUYER_VAT, operator: "=", value_from: "DEPART" }
    group_by: ["DEPART"]
    aggregation: { column: AMOUNT_SIGNED, function: SUM }

  # 4) Intracommunautaire (vend. ≠ achet. ≠ vide)
  - id: intra_total
    label: "Intracommunautaire - Total"
    filters:
      - { column: SCHEME, operator: "=", value: "REGULAR" }
      - { column: BUYER_VAT, operator: "!=", value_from: "DEPART" }
      - { column: BUYER_VAT, operator: "is_not_empty" }
    aggregations:
      - { column: AMOUNT_SIGNED, function: SUM }
      - { column: AMOUNT_SIGNED, function: COUNT }

  - id: intra_by_country
    label: "Intracommunautaire - Par pays (départ)"
    filters:
      - { column: SCHEME, operator: "=", value: "REGULAR" }
      - { column: BUYER_VAT, operator: "!=", value_from: "DEPART" }
      - { column: BUYER_VAT, operator: "is_not_empty" }
    group_by: ["DEPART"]
    aggregation: { column: AMOUNT_SIGNED, function: SUM }

  # 5) Suisse (VOEC)
  - id: suisse_total
    label: "Suisse (VOEC) - Total"
    filters:
      - { column: SCHEME, operator: "=", value: "CH_VOEC" }
    aggregations:
      - { column: AMOUNT_SIGNED, function: SUM }
      - { column: AMOUNT_SIGNED, function: COUNT }

  - id: suisse_by_country
    label: "Suisse (VOEC) - Par pays (arrivée)"
    filters:
      - { column: SCHEME, operator: "=", value: "CH_VOEC" }
    group_by: ["ARRIVAL"]
    aggregation: { column: AMOUNT_SIGNED, function: SUM }

  # 6) Grand total (toutes catégories)
  - id: grand_total_all
    label: "Total général (toutes transactions)"
    filters: []
    aggregation: { column: AMOUNT_SIGNED, function: SUM }

  # 7) REGULAR total & par pays (pour sanity check)
  - id: regular_total
    label: "REGULAR - Total"
    filters:
      - { column: SCHEME, operator: "=", value: "REGULAR" }
    aggregation: { column: AMOUNT_SIGNED, function: SUM }

  - id: regular_by_country
    label: "REGULAR - Par pays (départ)"
    filters:
      - { column: SCHEME, operator: "=", value: "REGULAR" }
    group_by: ["DEPART"]
    aggregation: { column: AMOUNT_SIGNED, function: SUM }

  # 8) Autre / Résidu (tout ce qui n'entre dans aucune cat.)
  #    Implémenté par exclusion des 5 catégories ci-dessus.
  - id: residu_total
    label: "Autre / Résidu - Total"
    filters:
      - exclude_rules: ["oss_total","b2c_total","b2b_dom_total","intra_total","suisse_total"]
    aggregation: { column: AMOUNT_SIGNED, function: SUM }

# ============================================
# KPI CARDS — en tête du dashboard
# ============================================
kpi_cards:
  - title: "Total général"
    rule: grand_total_all
    metrics:
      - { label: "Montant HT (signé)", field: "SUM(AMOUNT_SIGNED)" }
      - { label: "Transactions",        field: "COUNT(AMOUNT_SIGNED)" }

  - title: "OSS"
    rule: oss_total
    metrics:
      - { label: "Montant HT (signé)", field: "SUM(AMOUNT_SIGNED)" }
      - { label: "Transactions",        field: "COUNT(AMOUNT_SIGNED)" }

  - title: "Domestique B2C"
    rule: b2c_total
    metrics:
      - { label: "Montant HT (signé)", field: "SUM(AMOUNT_SIGNED)" }
      - { label: "Transactions",        field: "COUNT(AMOUNT_SIGNED)" }

  - title: "Domestique B2B"
    rule: b2b_dom_total
    metrics:
      - { label: "Montant HT (signé)", field: "SUM(AMOUNT_SIGNED)" }
      - { label: "Transactions",        field: "COUNT(AMOUNT_SIGNED)" }

  - title: "Intracommunautaire"
    rule: intra_total
    metrics:
      - { label: "Montant HT (signé)", field: "SUM(AMOUNT_SIGNED)" }
      - { label: "Transactions",        field: "COUNT(AMOUNT_SIGNED)" }

  - title: "Suisse (VOEC)"
    rule: suisse_total
    metrics:
      - { label: "Montant HT (signé)", field: "SUM(AMOUNT_SIGNED)" }
      - { label: "Transactions",        field: "COUNT(AMOUNT_SIGNED)" }

  - title: "Autre / Résidu"
    rule: residu_total
    metrics:
      - { label: "Montant HT (signé)", field: "SUM(AMOUNT_SIGNED)" }
      - { label: "Transactions",        field: "COUNT(AMOUNT_SIGNED)" }
`;

interface ProcessedTransaction {
  TX_TYPE: string;
  AMOUNT_RAW: number;
  AMOUNT_SIGNED: number;
  SCHEME: string;
  ARRIVAL: string;
  DEPART: string;
  BUYER_VAT: string;
}

interface RuleResult {
  id: string;
  label: string;
  sum?: number;
  count?: number;
  byCountry?: { [country: string]: number };
}

export function processVATWithNewYAMLRules(csvContent: string): DetailedVATReport {
  console.log('🚀 Nouveau moteur YAML démarré');

  try {
    // Parse CSV
    const transactions = parseCSV(csvContent);
    console.log(`📊 ${transactions.length} transactions brutes trouvées`);

    if (transactions.length === 0) {
      return createEmptyReport();
    }

    // Preprocessing
    const processedTransactions = preprocessTransactions(transactions);
    console.log(`✅ ${processedTransactions.length} transactions après preprocessing`);

    // Apply rules
    const ruleResults = applyRules(processedTransactions);
    console.log(`📋 ${Object.keys(ruleResults).length} règles appliquées`);

    // Generate breakdown for UI
    const breakdown = generateBreakdown(ruleResults);
    console.log(`🌍 ${breakdown.length} pays dans le breakdown`);

    // Generate KPI cards
    const kpiCards = generateKPICards(ruleResults);
    console.log(`📈 ${kpiCards.length} KPI cards générées`);

    // Generate debug info
    const grandTotal = ruleResults['grand_total_all']?.sum || 0;
    console.log(`💰 Grand total: ${grandTotal.toFixed(2)} €`);

    return {
      breakdown,
      kpiCards,
      sanityCheckGlobal: {
        grandTotal,
        ossTotal: ruleResults['oss_total']?.sum || 0,
        regularTotal: ruleResults['regular_total']?.sum || 0,
        suisseTotal: ruleResults['suisse_total']?.sum || 0,
        residuTotal: ruleResults['residu_total']?.sum || 0,
        b2cTotal: ruleResults['b2c_total']?.sum || 0,
        b2bTotal: ruleResults['b2b_dom_total']?.sum || 0,
        intracomTotal: ruleResults['intra_total']?.sum || 0,
        diffGrandTotalVsSum: 0,
        diffRegularVsComponents: 0,
        isValid: true
      },
      sanityCheckByCountry: [],
      rulesApplied: {
        ossRules: ruleResults['oss_total']?.count || 0,
        domesticB2CRules: ruleResults['b2c_total']?.count || 0,
        domesticB2BRules: ruleResults['b2b_dom_total']?.count || 0,
        intracommunautaireRules: ruleResults['intra_total']?.count || 0,
        suisseRules: ruleResults['suisse_total']?.count || 0,
        residuelRules: ruleResults['residu_total']?.count || 0,
        totalProcessed: processedTransactions.length
      }
    };

  } catch (error) {
    console.error('❌ Erreur dans le nouveau moteur YAML:', error);
    return createEmptyReport();
  }
}

function parseCSV(csvContent: string): any[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Gérer BOM et détecter le délimiteur sur la première ligne
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
    const tx: any = {};
    headers.forEach((header, idx) => {
      const value = values[idx] ?? '';
      tx[header] = typeof value === 'string' ? value.trim() : value;
    });
    transactions.push(tx);
  }
  return transactions;
}

function detectDelimiter(sample: string): string {
  const counts = {
    ',': (sample.match(/,/g) || []).length,
    ';': (sample.match(/;/g) || []).length,
    '\t': (sample.match(/\t/g) || []).length,
    '|': (sample.match(/\|/g) || []).length,
  } as Record<string, number>;
  let best = ',';
  let max = -1;
  for (const [del, count] of Object.entries(counts)) {
    if (count > max) { max = count; best = del; }
  }
  return best;
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      // Toggle quotes unless it's an escaped quote
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(s => s.trim().replace(/^\uFEFF/, ''));
}

// Helpers pour extraire et normaliser le type de transaction depuis différentes colonnes Amazon
function extractRawTxType(tx: any): string {
  const candidateKeys = [
    'TRANSACTION_TYPE',
    'TRANSACTION_EVENT_TYPE',
    'EVENT_TYPE',
    'TYPE',
    'ORDER_EVENT_TYPE',
    'VAT_TRANSACTION_TYPE',
    'TX_TYPE'
  ];
  for (const key of candidateKeys) {
    if (tx[key] !== undefined && tx[key] !== null && String(tx[key]).trim() !== '') {
      return String(tx[key]).toUpperCase().trim();
    }
  }
  // Fallback robuste: scanner toutes les colonnes "type"/"évènement" pour repérer SALE/REFUND (multi-langues)
  const refundRe = /(REFUND|REFUNDS|RETURN|REVERSAL|CREDIT|REMBOURSEMENT|RETOUR|AVOIR)/i;
  const saleRe = /(SALE|SALES|SHIPMENT|ORDER|CHARGE|DEBIT|VENTE|EXPEDITION|COMMANDE)/i;
  for (const [k, v] of Object.entries(tx)) {
    const ku = k.toUpperCase();
    if (/(TYPE|TRANSA|EVENT|OPERATION|EVENEMENT)/.test(ku)) {
      const val = String(v || '').toUpperCase();
      if (!val) continue;
      if (refundRe.test(val)) return 'REFUND';
      if (saleRe.test(val)) return 'SALE';
    }
  }
  // Dernier recours: chercher la valeur dans n'importe quelle colonne si très explicite
  for (const v of Object.values(tx)) {
    const val = String(v || '').toUpperCase();
    if (refundRe.test(val)) return 'REFUND';
    if (saleRe.test(val)) return 'SALE';
  }
  return '';
}

function normalizeTxType(value: string): 'SALE' | 'REFUND' | 'OTHER' {
  const v = (value || '').toUpperCase();
  if (!v) return 'OTHER';
  // Mappage généreux basé sur les rapports Amazon
  if (/(REFUND|REFUNDS|RETURN|REVERSAL|CREDIT)/.test(v)) return 'REFUND';
  if (/(SALE|SALES|SHIPMENT|ORDER|CHARGE|DEBIT)/.test(v)) return 'SALE';
  return 'OTHER';
}

function preprocessTransactions(transactions: any[]): ProcessedTransaction[] {
  const processed: ProcessedTransaction[] = [];

  // Stat pour debug si rien ne passe
  const seenTypes = new Map<string, number>();

for (const tx of transactions) {
  const rawType = extractRawTxType(tx);
  seenTypes.set(rawType || '(VIDE)', (seenTypes.get(rawType || '(VIDE)') || 0) + 1);
  const txType = normalizeTxType(rawType);
  if (txType === 'OTHER') continue;

  // Montant brut: essayer de nombreuses variantes Amazon
  const amountCandidateKeys = [
    'TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL',
    'TOTAL_ACTIVITY_VALUE_AMOUNT_VAT_EXCL',
    'TRANSACTION_VALUE_VAT_EXCL',
    'TRANSACTION_VALUE_AMOUNT_VAT_EXCL',
    'TOTAL_ACTIVITY_VALUE_AMT',
    'TOTAL_ACTIVITY_VALUE',
    'TRANSACTION_VALUE',
    'AMOUNT_RAW',
    'PRICE_AMOUNT_VAT_EXCL',
    'ITEM_PRICE_VAT_EXCL',
    'ITEM_PRICE_AMOUNT',
    'ORDER_ITEM_PRICE'
  ];
  let amountStr = '';
  for (const k of amountCandidateKeys) {
    const val = (tx as any)[k];
    if (val !== undefined && val !== null && String(val).trim() !== '') { amountStr = String(val); break; }
  }
  // Fallback heuristique: prendre la première colonne "montant" plausible
  if (!amountStr) {
    for (const [key, val] of Object.entries(tx)) {
      const keyU = key.toUpperCase();
      if (/(AMOUNT|AMT|VALUE|PRICE|TOTAL)/.test(keyU) && !/(TAX_RATE|VAT_RATE|PERCENT|QTY|QUANTITY|COUNT)/.test(keyU)) {
        const s = String(val ?? '').trim();
        if (s && /[0-9]/.test(s)) { amountStr = s; break; }
      }
    }
  }
  const amountRaw = parseAmount(amountStr);
  const amountSigned = txType === 'REFUND' ? -Math.abs(amountRaw) : Math.abs(amountRaw);

  // Champs normalisés avec fallback + normalisation schéma
  let scheme = String((tx as any).TAX_REPORTING_SCHEME ?? (tx as any).SCHEME ?? (tx as any).TAX_SCHEME ?? '').toUpperCase().trim();
  scheme = scheme.replace(/\s+/g, '-');
  if (/OSS/i.test(scheme)) scheme = 'UNION-OSS';
  if (scheme === 'CH-VOEC') scheme = 'CH_VOEC';

  const arrivalCandidateKeys = [
    'SALE_ARRIVAL_COUNTRY','ARRIVAL','ARRIVAL_COUNTRY',
    'SHIP_TO_COUNTRY','SHIP_TO_COUNTRY_CODE',
    'DESTINATION_COUNTRY','DESTINATION_COUNTRY_CODE'
  ];
  let arrival = '';
  for (const k of arrivalCandidateKeys) {
    const v = (tx as any)[k];
    if (v) { arrival = normalizeCountry(String(v)); if (arrival) break; }
  }

  const departCandidateKeys = [
    'SALE_DEPART_COUNTRY','DEPART','DEPARTURE_COUNTRY',
    'SHIP_FROM_COUNTRY','SHIP_FROM_COUNTRY_CODE',
    'ORIGIN_COUNTRY','ORIGIN_COUNTRY_CODE','FULFILLMENT_CENTER_COUNTRY'
  ];
  let depart = '';
  for (const k of departCandidateKeys) {
    const v = (tx as any)[k];
    if (v) { depart = normalizeCountry(String(v)); if (depart) break; }
  }

  // BUYER_VAT: essayer pays direct sinon extraire du numéro de TVA
  const buyerVatCandidateKeys = [
    'BUYER_VAT_NUMBER_COUNTRY','BUYER_VAT','BUYER_VAT_COUNTRY','B2B_BUYER_VAT_COUNTRY','BUYER_VAT_NUMBER'
  ];
  let buyerVat = '';
  for (const k of buyerVatCandidateKeys) {
    const v = (tx as any)[k];
    if (v) {
      const s = String(v).toUpperCase().trim();
      const m = s.match(/^([A-Z]{2})/);
      buyerVat = normalizeCountry(m ? m[1] : s);
      if (buyerVat) break;
    }
  }

  // Normaliser les vides (B2C)
  const emptyValues = ['', '(VIDE)', '(VIDES)', 'NULL', 'N/A', '-', '—', 'NONE', ' '];
  if (emptyValues.includes(buyerVat)) {
    buyerVat = '';
  }

  processed.push({
    TX_TYPE: txType,
    AMOUNT_RAW: amountRaw,
    AMOUNT_SIGNED: amountSigned,
    SCHEME: scheme,
    ARRIVAL: arrival,
    DEPART: depart,
    BUYER_VAT: buyerVat
  });
}

  if (processed.length === 0) {
    console.warn('⚠️ Aucune transaction retenue après preprocessing. Types vus:', Array.from(seenTypes.entries()));
  }

  return processed;
}

function parseAmount(value: string): number {
  if (value === undefined || value === null) return 0;

  // Stringify and normalize common oddities from Amazon/Excel exports
  let s = String(value)
    .replace(/[€$£¥]/g, '') // currency symbols
    .replace(/[\u00A0\s]/g, '') // spaces including NBSP
    .replace(/[−–—]/g, '-') // various minus dashes to ASCII minus
    .trim();

  // Determine negativity but ignore it in returned value (sign handled by tx type)
  const isParenNegative = /^\(.*\)$/.test(s);
  const hasMinus = s.includes('-');
  const negative = isParenNegative || hasMinus;

  // Strip wrappers and signs, we return absolute and let business logic sign later
  s = s.replace(/^\((.*)\)$/,'$1').replace(/-/g,'');

  // Decide decimal separator strategy
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastDot !== -1 && lastComma !== -1) {
    // Both present: keep the one that appears last as decimal, remove the other
    if (lastDot > lastComma) {
      s = s.replace(/,/g, ''); // commas as thousands
    } else {
      s = s.replace(/\./g, ''); // dots as thousands
      s = s.replace(/,/g, '.'); // comma decimal
    }
  } else if (lastComma !== -1 && lastDot === -1) {
    s = s.replace(/,/g, '.');
  }

  // Remove any remaining non digit/decimal
  s = s.replace(/[^0-9.]/g, '');

  // Collapse multiple dots to a single decimal point (last one kept)
  const parts = s.split('.');
  if (parts.length > 2) {
    const decimal = parts.pop();
    s = parts.join('') + (decimal !== undefined ? '.' + decimal : '');
  }

  const n = parseFloat(s);
  const abs = isNaN(n) ? 0 : Math.abs(n);
  return abs; // business logic will apply sign for REFUND
}

function normalizeCountry(country: string): string {
  if (!country) return '';
  return country.toUpperCase().trim().replace(/['"]/g, '');
}

function applyRules(transactions: ProcessedTransaction[]): { [ruleId: string]: RuleResult } {
  const results: { [ruleId: string]: RuleResult } = {};

  // 1. OSS rules
  const ossTransactions = transactions.filter(tx => tx.SCHEME === 'UNION-OSS');
  results['oss_total'] = {
    id: 'oss_total',
    label: 'OSS - Total',
    sum: ossTransactions.reduce((sum, tx) => sum + tx.AMOUNT_SIGNED, 0),
    count: ossTransactions.length
  };

  results['oss_by_country'] = {
    id: 'oss_by_country',
    label: 'OSS - Par pays (arrivée)',
    byCountry: groupByCountry(ossTransactions, 'ARRIVAL')
  };

  // 2. B2C rules (REGULAR + empty BUYER_VAT)
  const b2cTransactions = transactions.filter(tx => 
    tx.SCHEME === 'REGULAR' && tx.BUYER_VAT === ''
  );
  results['b2c_total'] = {
    id: 'b2c_total',
    label: 'Domestique B2C - Total',
    sum: b2cTransactions.reduce((sum, tx) => sum + tx.AMOUNT_SIGNED, 0),
    count: b2cTransactions.length
  };

  results['b2c_by_country'] = {
    id: 'b2c_by_country',
    label: 'Domestique B2C - Par pays (départ)',
    byCountry: groupByCountry(b2cTransactions, 'DEPART')
  };

  // 3. B2B domestic rules (REGULAR + BUYER_VAT === DEPART)
  const b2bTransactions = transactions.filter(tx => 
    tx.SCHEME === 'REGULAR' && tx.BUYER_VAT !== '' && tx.BUYER_VAT === tx.DEPART
  );
  results['b2b_dom_total'] = {
    id: 'b2b_dom_total',
    label: 'Domestique B2B - Total',
    sum: b2bTransactions.reduce((sum, tx) => sum + tx.AMOUNT_SIGNED, 0),
    count: b2bTransactions.length
  };

  results['b2b_dom_by_country'] = {
    id: 'b2b_dom_by_country',
    label: 'Domestique B2B - Par pays (départ)',
    byCountry: groupByCountry(b2bTransactions, 'DEPART')
  };

  // 4. Intracommunautaire rules (REGULAR + BUYER_VAT !== DEPART + BUYER_VAT not empty)
  const intraTransactions = transactions.filter(tx => 
    tx.SCHEME === 'REGULAR' && tx.BUYER_VAT !== '' && tx.BUYER_VAT !== tx.DEPART
  );
  results['intra_total'] = {
    id: 'intra_total',
    label: 'Intracommunautaire - Total',
    sum: intraTransactions.reduce((sum, tx) => sum + tx.AMOUNT_SIGNED, 0),
    count: intraTransactions.length
  };

  results['intra_by_country'] = {
    id: 'intra_by_country',
    label: 'Intracommunautaire - Par pays (départ)',
    byCountry: groupByCountry(intraTransactions, 'DEPART')
  };

  // 5. Suisse rules
  const suisseTransactions = transactions.filter(tx => tx.SCHEME === 'CH_VOEC');
  results['suisse_total'] = {
    id: 'suisse_total',
    label: 'Suisse (VOEC) - Total',
    sum: suisseTransactions.reduce((sum, tx) => sum + tx.AMOUNT_SIGNED, 0),
    count: suisseTransactions.length
  };

  results['suisse_by_country'] = {
    id: 'suisse_by_country',
    label: 'Suisse (VOEC) - Par pays (arrivée)',
    byCountry: groupByCountry(suisseTransactions, 'ARRIVAL')
  };

  // 6. Grand total
  results['grand_total_all'] = {
    id: 'grand_total_all',
    label: 'Total général (toutes transactions)',
    sum: transactions.reduce((sum, tx) => sum + tx.AMOUNT_SIGNED, 0),
    count: transactions.length
  };

  // 7. REGULAR total
  const regularTransactions = transactions.filter(tx => tx.SCHEME === 'REGULAR');
  results['regular_total'] = {
    id: 'regular_total',
    label: 'REGULAR - Total',
    sum: regularTransactions.reduce((sum, tx) => sum + tx.AMOUNT_SIGNED, 0),
    count: regularTransactions.length
  };

  // 8. Résidu (exclude OSS, B2C, B2B, Intra, Suisse)
  const classifiedTransactions = new Set([
    ...ossTransactions,
    ...b2cTransactions,
    ...b2bTransactions,
    ...intraTransactions,
    ...suisseTransactions
  ]);
  
  const residuTransactions = transactions.filter(tx => !classifiedTransactions.has(tx));
  results['residu_total'] = {
    id: 'residu_total',
    label: 'Autre / Résidu - Total',
    sum: residuTransactions.reduce((sum, tx) => sum + tx.AMOUNT_SIGNED, 0),
    count: residuTransactions.length
  };

  return results;
}

function groupByCountry(transactions: ProcessedTransaction[], countryField: 'ARRIVAL' | 'DEPART'): { [country: string]: number } {
  const grouped: { [country: string]: number } = {};
  
  for (const tx of transactions) {
    const country = tx[countryField];
    if (country) {
      grouped[country] = (grouped[country] || 0) + tx.AMOUNT_SIGNED;
    }
  }
  
  return grouped;
}

function generateBreakdown(ruleResults: { [ruleId: string]: RuleResult }): VATRuleData[] {
  const breakdown: VATRuleData[] = [];

  // Collect all countries from by_country rules
  const allCountries = new Set<string>();
  
  ['oss_by_country', 'b2c_by_country', 'b2b_dom_by_country', 'intra_by_country', 'suisse_by_country'].forEach(ruleId => {
    const rule = ruleResults[ruleId];
    if (rule?.byCountry) {
      Object.keys(rule.byCountry).forEach(country => allCountries.add(country));
    }
  });

  // Generate breakdown for each country
  allCountries.forEach(country => {
    const oss = ruleResults['oss_by_country']?.byCountry?.[country] || 0;
    const b2c = ruleResults['b2c_by_country']?.byCountry?.[country] || 0;
    const b2b = ruleResults['b2b_dom_by_country']?.byCountry?.[country] || 0;
    const intra = ruleResults['intra_by_country']?.byCountry?.[country] || 0;
    const suisse = ruleResults['suisse_by_country']?.byCountry?.[country] || 0;

    const total = oss + b2c + b2b + intra + suisse;

    if (total !== 0) {
      breakdown.push({
        country,
        oss,
        domesticB2C: b2c,
        domesticB2B: b2b,
        intracommunautaire: intra,
        suisse,
        residuel: 0, // TODO: calculate residuel for this country
        total
      });
    }
  });

  return breakdown.sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
}

function generateKPICards(ruleResults: { [ruleId: string]: RuleResult }): VATKPICard[] {
  const kpiCards: VATKPICard[] = [];

  const kpiConfig = [
    { title: 'Total général', ruleId: 'grand_total_all' },
    { title: 'OSS', ruleId: 'oss_total' },
    { title: 'Domestique B2C', ruleId: 'b2c_total' },
    { title: 'Domestique B2B', ruleId: 'b2b_dom_total' },
    { title: 'Intracommunautaire', ruleId: 'intra_total' },
    { title: 'Suisse (VOEC)', ruleId: 'suisse_total' },
    { title: 'Autre / Résidu', ruleId: 'residu_total' }
  ];

  kpiConfig.forEach(config => {
    const rule = ruleResults[config.ruleId];
    if (rule) {
      kpiCards.push({
        title: config.title,
        amount: rule.sum || 0,
        count: rule.count || 0
      });
    }
  });

  return kpiCards;
}

function createEmptyReport(): DetailedVATReport {
  return {
    breakdown: [],
    kpiCards: [],
    sanityCheckGlobal: {
      grandTotal: 0,
      ossTotal: 0,
      regularTotal: 0,
      suisseTotal: 0,
      residuTotal: 0,
      b2cTotal: 0,
      b2bTotal: 0,
      intracomTotal: 0,
      diffGrandTotalVsSum: 0,
      diffRegularVsComponents: 0,
      isValid: true
    },
    sanityCheckByCountry: [],
    rulesApplied: {
      ossRules: 0,
      domesticB2CRules: 0,
      domesticB2BRules: 0,
      intracommunautaireRules: 0,
      suisseRules: 0,
      residuelRules: 0,
      totalProcessed: 0
    }
  };
}
