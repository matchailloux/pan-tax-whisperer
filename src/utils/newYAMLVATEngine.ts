import { DetailedVATReport, VATRuleData, VATKPICard } from './newVATRulesEngine';

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

  // Detect delimiter
  const firstLine = lines[0];
  const delimiters = ['\t', ';', '|', ','];
  let delimiter = ',';
  let maxCols = 0;

  for (const del of delimiters) {
    const cols = firstLine.split(del).length;
    if (cols > maxCols) {
      maxCols = cols;
      delimiter = del;
    }
  }

  console.log(`📝 Délimiteur détecté: "${delimiter}"`);

  // Parse header
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
  
  // Parse data
  const transactions = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
    if (values.length === headers.length) {
      const transaction: any = {};
      headers.forEach((header, index) => {
        transaction[header] = values[index];
      });
      transactions.push(transaction);
    }
  }

  return transactions;
}

function preprocessTransactions(transactions: any[]): ProcessedTransaction[] {
  const processed: ProcessedTransaction[] = [];

  for (const tx of transactions) {
    // Filter: only SALE and REFUND
    const txType = (tx.TRANSACTION_TYPE || '').toUpperCase().trim();
    if (txType !== 'SALE' && txType !== 'REFUND') continue;

    // Extract and clean fields
    const amountRaw = parseAmount(tx.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL || '');
    const amountSigned = txType === 'REFUND' ? -Math.abs(amountRaw) : Math.abs(amountRaw);
    
    const scheme = (tx.TAX_REPORTING_SCHEME || '').toUpperCase().trim();
    const arrival = normalizeCountry(tx.SALE_ARRIVAL_COUNTRY || '');
    const depart = normalizeCountry(tx.SALE_DEPART_COUNTRY || '');
    let buyerVat = normalizeCountry(tx.BUYER_VAT_NUMBER_COUNTRY || '');

    // Normalize empty values for BUYER_VAT
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

  return processed;
}

function parseAmount(value: string): number {
  if (!value) return 0;
  
  let cleaned = value.toString()
    .replace(/[€$£¥]/g, '') // Remove currency symbols
    .replace(/\s/g, '') // Remove spaces
    .replace(/['"]/g, '') // Remove quotes
    .replace(/,/g, '.'); // Replace comma with dot for decimal

  // Remove thousand separators (but keep the last dot for decimal)
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    // Multiple dots, the last one is likely decimal
    const decimal = parts.pop();
    cleaned = parts.join('') + '.' + decimal;
  }

  const result = parseFloat(cleaned);
  return isNaN(result) ? 0 : result;
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
