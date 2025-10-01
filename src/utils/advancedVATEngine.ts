// Moteur de règles avancé pour l'analyse TVA Amazon

const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

const DOMESTIC_TARGET_COUNTRIES = ['FR', 'DE', 'ES', 'IT'];

interface CSVRow {
  [key: string]: string;
}

interface ProcessedTransaction {
  TX_EVENT_ID?: string;
  TX_TYPE: 'SALE' | 'REFUND';
  HT: number;
  TVA: number;
  ARRIVAL_COUNTRY: string;
  DEPART_COUNTRY?: string;
  BUYER_VAT?: string;
  TAX_SCHEME?: string;
  TAX_RESP?: string;
  CURRENCY: string;
  CATEGORIE: 'OSS' | 'REGULAR' | 'INTRACOM B2B' | 'EXPORT' | 'A_VERIFIER';
}

interface ConsolidatedRow {
  pays: string;
  categorie: string;
  ca_ht: number;
  tva: number;
  transactions: number;
}

interface DomesticVAT {
  pays: string;
  tva: number;
  ca_ht: number;
  transactions: number;
}

interface OSSVAT {
  pays: string;
  tva: number;
  ca_ht: number;
  transactions: number;
}

interface Anomaly {
  type: string;
  description: string;
  tx_event_id?: string;
}

export interface AdvancedVATReport {
  consolidated: ConsolidatedRow[];
  domesticVAT: DomesticVAT[];
  ossVAT: OSSVAT[];
  anomalies: Anomaly[];
  currencies: string[];
}

// Étape 1: Nettoyage et préparation
function cleanHeaders(header: string): string {
  return header
    .replace(/^\uFEFF/, '') // BOM
    .replace(/^"|"$/g, '') // guillemets
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

function parseCSV(content: string): CSVRow[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const rawHeaders = lines[0].split(/[,;\t]/);
  const headers = rawHeaders.map(cleanHeaders);

  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/[,;\t]/);
    const row: CSVRow = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.replace(/^"|"$/g, '').trim() || '';
    });
    rows.push(row);
  }

  return rows;
}

function mapColumns(row: CSVRow): Partial<ProcessedTransaction> {
  const mapped: Partial<ProcessedTransaction> = {};

  // Mapping des colonnes
  if (row.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL) mapped.HT = parseFloat(row.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL) || 0;
  if (row.TOTAL_ACTIVITY_VALUE_VAT_AMT) mapped.TVA = parseFloat(row.TOTAL_ACTIVITY_VALUE_VAT_AMT) || 0;
  
  const txType = (row.TRANSACTION_TYPE || '').toUpperCase();
  if (txType === 'SALE' || txType === 'REFUND') {
    mapped.TX_TYPE = txType as 'SALE' | 'REFUND';
  }

  mapped.ARRIVAL_COUNTRY = (row.SALE_ARRIVAL_COUNTRY || row.TAXABLE_JURISDICTION || '').toUpperCase().trim();
  mapped.DEPART_COUNTRY = (row.SALE_DEPART_COUNTRY || '').toUpperCase().trim();
  mapped.BUYER_VAT = (row.BUYER_VAT_NUMBER || '').trim();
  mapped.TAX_SCHEME = (row.TAX_REPORTING_SCHEME || '').toUpperCase().trim();
  mapped.TAX_RESP = (row.TAX_COLLECTION_RESPONSIBILITY || '').toUpperCase().trim();
  mapped.TX_EVENT_ID = row.TRANSACTION_EVENT_ID;
  mapped.CURRENCY = (row.TRANSACTION_CURRENCY_CODE || row.CURRENCY || 'EUR').toUpperCase().trim();

  // REFUND = montants négatifs
  if (mapped.TX_TYPE === 'REFUND') {
    if (mapped.HT !== undefined) mapped.HT = -Math.abs(mapped.HT);
    if (mapped.TVA !== undefined) mapped.TVA = -Math.abs(mapped.TVA);
  }

  return mapped;
}

function isValidVAT(vat: string): boolean {
  if (!vat || vat.length < 4) return false;
  // Format basique: 2 lettres + chiffres
  return /^[A-Z]{2}[0-9A-Z]{2,}/.test(vat);
}

// Étape 2: Catégorisation
function categorize(tx: Partial<ProcessedTransaction>): string {
  const arrival = tx.ARRIVAL_COUNTRY || '';
  const depart = tx.DEPART_COUNTRY || '';
  const buyerVAT = tx.BUYER_VAT || '';
  const taxScheme = tx.TAX_SCHEME || '';

  // 1) EXPORT (hors UE)
  if (arrival && !EU_COUNTRIES.includes(arrival)) {
    return 'EXPORT';
  }

  // 2) INTRACOM B2B
  if (arrival && EU_COUNTRIES.includes(arrival) && isValidVAT(buyerVAT)) {
    return 'INTRACOM B2B';
  }

  // 3) REGULAR (domestique)
  if (depart && arrival && depart === arrival) {
    return 'REGULAR';
  }
  if (taxScheme.includes('DOMESTIC') || taxScheme.includes('LOCAL')) {
    return 'REGULAR';
  }

  // 4) OSS (B2C transfrontalière UE)
  if (arrival && EU_COUNTRIES.includes(arrival) && !isValidVAT(buyerVAT)) {
    return 'OSS';
  }

  // 5) A_VERIFIER
  return 'A_VERIFIER';
}

// Étape 3: Consolidation
function consolidate(transactions: ProcessedTransaction[]): ConsolidatedRow[] {
  const map = new Map<string, ConsolidatedRow>();

  transactions.forEach(tx => {
    const key = `${tx.ARRIVAL_COUNTRY}|${tx.CATEGORIE}`;
    if (!map.has(key)) {
      map.set(key, {
        pays: tx.ARRIVAL_COUNTRY,
        categorie: tx.CATEGORIE,
        ca_ht: 0,
        tva: 0,
        transactions: 0
      });
    }
    const row = map.get(key)!;
    row.ca_ht += tx.HT;
    row.tva += tx.TVA;
    row.transactions++;
  });

  const rows = Array.from(map.values()).map(row => ({
    ...row,
    ca_ht: Math.round(row.ca_ht * 100) / 100,
    tva: Math.round(row.tva * 100) / 100
  }));

  // Tri par pays puis catégorie
  rows.sort((a, b) => {
    if (a.pays !== b.pays) return a.pays.localeCompare(b.pays);
    return a.categorie.localeCompare(b.categorie);
  });

  // Ligne total
  const total: ConsolidatedRow = {
    pays: 'TOTAL GÉNÉRAL',
    categorie: '',
    ca_ht: Math.round(rows.reduce((sum, r) => sum + r.ca_ht, 0) * 100) / 100,
    tva: Math.round(rows.reduce((sum, r) => sum + r.tva, 0) * 100) / 100,
    transactions: rows.reduce((sum, r) => sum + r.transactions, 0)
  };
  rows.push(total);

  return rows;
}

// Étape 4: Récaps TVA
function getDomesticVAT(transactions: ProcessedTransaction[]): DomesticVAT[] {
  const regular = transactions.filter(tx => tx.CATEGORIE === 'REGULAR');
  const map = new Map<string, DomesticVAT>();

  // Initialiser les pays cibles même si 0
  DOMESTIC_TARGET_COUNTRIES.forEach(country => {
    map.set(country, { pays: country, tva: 0, ca_ht: 0, transactions: 0 });
  });

  regular.forEach(tx => {
    if (DOMESTIC_TARGET_COUNTRIES.includes(tx.ARRIVAL_COUNTRY)) {
      const row = map.get(tx.ARRIVAL_COUNTRY)!;
      row.tva += tx.TVA;
      row.ca_ht += tx.HT;
      row.transactions++;
    }
  });

  return Array.from(map.values()).map(row => ({
    ...row,
    tva: Math.round(row.tva * 100) / 100,
    ca_ht: Math.round(row.ca_ht * 100) / 100
  }));
}

function getOSSVAT(transactions: ProcessedTransaction[]): OSSVAT[] {
  const oss = transactions.filter(tx => tx.CATEGORIE === 'OSS');
  const map = new Map<string, OSSVAT>();

  oss.forEach(tx => {
    if (!map.has(tx.ARRIVAL_COUNTRY)) {
      map.set(tx.ARRIVAL_COUNTRY, {
        pays: tx.ARRIVAL_COUNTRY,
        tva: 0,
        ca_ht: 0,
        transactions: 0
      });
    }
    const row = map.get(tx.ARRIVAL_COUNTRY)!;
    row.tva += tx.TVA;
    row.ca_ht += tx.HT;
    row.transactions++;
  });

  const rows = Array.from(map.values()).map(row => ({
    ...row,
    tva: Math.round(row.tva * 100) / 100,
    ca_ht: Math.round(row.ca_ht * 100) / 100
  })).sort((a, b) => a.pays.localeCompare(b.pays));

  // Total OSS
  const total: OSSVAT = {
    pays: 'TOTAL OSS',
    tva: Math.round(rows.reduce((sum, r) => sum + r.tva, 0) * 100) / 100,
    ca_ht: Math.round(rows.reduce((sum, r) => sum + r.ca_ht, 0) * 100) / 100,
    transactions: rows.reduce((sum, r) => sum + r.transactions, 0)
  };
  rows.push(total);

  return rows;
}

// Étape 5: Anomalies
function detectAnomalies(transactions: ProcessedTransaction[]): Anomaly[] {
  const anomalies: Anomaly[] = [];

  transactions.forEach(tx => {
    // B2B avec VAT manquant
    if (tx.CATEGORIE === 'INTRACOM B2B' && !isValidVAT(tx.BUYER_VAT || '')) {
      anomalies.push({
        type: 'B2B_VAT_MANQUANT',
        description: `Ligne B2B sans numéro TVA valide: ${tx.ARRIVAL_COUNTRY}`,
        tx_event_id: tx.TX_EVENT_ID
      });
    }

    // Sans pays d'arrivée
    if (!tx.ARRIVAL_COUNTRY) {
      anomalies.push({
        type: 'PAYS_MANQUANT',
        description: 'Ligne sans pays d\'arrivée',
        tx_event_id: tx.TX_EVENT_ID
      });
    }

    // TVA > 0 pour INTRACOM/EXPORT
    if ((tx.CATEGORIE === 'INTRACOM B2B' || tx.CATEGORIE === 'EXPORT') && tx.TVA > 0.01) {
      anomalies.push({
        type: 'TVA_ANORMALE',
        description: `TVA > 0 pour ${tx.CATEGORIE}: ${tx.ARRIVAL_COUNTRY}`,
        tx_event_id: tx.TX_EVENT_ID
      });
    }

    // REGULAR mais pays différents
    if (tx.CATEGORIE === 'REGULAR' && tx.DEPART_COUNTRY && tx.ARRIVAL_COUNTRY && 
        tx.DEPART_COUNTRY !== tx.ARRIVAL_COUNTRY) {
      anomalies.push({
        type: 'REGULAR_PAYS_DIFFERENTS',
        description: `REGULAR mais ${tx.DEPART_COUNTRY} → ${tx.ARRIVAL_COUNTRY}`,
        tx_event_id: tx.TX_EVENT_ID
      });
    }
  });

  return anomalies;
}

// Fonction principale
export function processAdvancedVAT(csvContent: string): AdvancedVATReport {
  const rows = parseCSV(csvContent);
  
  const transactions: ProcessedTransaction[] = [];
  const currencies = new Set<string>();

  rows.forEach(row => {
    const mapped = mapColumns(row);
    
    // Filtre: TX_TYPE valide, montants présents
    if (!mapped.TX_TYPE || (mapped.TX_TYPE !== 'SALE' && mapped.TX_TYPE !== 'REFUND')) return;
    if (mapped.HT === undefined || mapped.TVA === undefined) return;
    if (!mapped.ARRIVAL_COUNTRY) return;

    const categorie = categorize(mapped);
    
    const tx: ProcessedTransaction = {
      TX_EVENT_ID: mapped.TX_EVENT_ID,
      TX_TYPE: mapped.TX_TYPE,
      HT: mapped.HT,
      TVA: mapped.TVA,
      ARRIVAL_COUNTRY: mapped.ARRIVAL_COUNTRY,
      DEPART_COUNTRY: mapped.DEPART_COUNTRY,
      BUYER_VAT: mapped.BUYER_VAT,
      TAX_SCHEME: mapped.TAX_SCHEME,
      TAX_RESP: mapped.TAX_RESP,
      CURRENCY: mapped.CURRENCY || 'EUR',
      CATEGORIE: categorie as any
    };

    transactions.push(tx);
    currencies.add(tx.CURRENCY);
  });

  return {
    consolidated: consolidate(transactions),
    domesticVAT: getDomesticVAT(transactions),
    ossVAT: getOSSVAT(transactions),
    anomalies: detectAnomalies(transactions),
    currencies: Array.from(currencies)
  };
}
