// Moteur de règles avancé pour l'analyse TVA Amazon
// Lecture robuste de CSV avec détection automatique du séparateur

// EU country codes (excluding UK post-Brexit)
const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'EL', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT',
  'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
]);

const DOMESTIC_TARGET_COUNTRIES = ['FR', 'DE', 'ES', 'IT'];

// Country name to ISO code mapping
const COUNTRY_CODES: { [key: string]: string } = {
  'FRANCE': 'FR', 'GERMANY': 'DE', 'SPAIN': 'ES', 'ITALY': 'IT',
  'UNITED KINGDOM': 'GB', 'UK': 'GB', 'NETHERLANDS': 'NL',
  'BELGIUM': 'BE', 'AUSTRIA': 'AT', 'POLAND': 'PL', 'SWEDEN': 'SE',
  'DENMARK': 'DK', 'FINLAND': 'FI', 'IRELAND': 'IE', 'PORTUGAL': 'PT',
  'GREECE': 'GR', 'CZECH REPUBLIC': 'CZ', 'HUNGARY': 'HU', 'ROMANIA': 'RO',
  'BULGARIA': 'BG', 'CROATIA': 'HR', 'SLOVAKIA': 'SK', 'SLOVENIA': 'SI',
  'LUXEMBOURG': 'LU', 'ESTONIA': 'EE', 'LATVIA': 'LV', 'LITHUANIA': 'LT',
  'CYPRUS': 'CY', 'MALTA': 'MT', 'SWITZERLAND': 'CH', 'NORWAY': 'NO'
};

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

// New interfaces for detailed breakdown
interface TransactionDetail {
  type: 'SALE' | 'REFUND';
  total: number;  // TTC
  base: number;   // HT
  vat: number;    // TVA
  currency: string;
}

interface CountryDetail {
  country: string;
  total: number;  // TTC
  base: number;   // HT
  vat: number;    // TVA
  currency: string;
  details: TransactionDetail[];  // SALE et REFUND
}

interface RegimeData {
  countries: CountryDetail[];
  totalBase: number;
  totalVat: number;
  totalTTC: number;
}

interface DiagnosticInfo {
  columns: Array<{ name: string; samples: string[] }>;
  rowCount: number;
  delimiter: string;
}

export interface AdvancedVATReport {
  consolidated: ConsolidatedRow[];
  domesticVAT: DomesticVAT[];
  ossVAT: OSSVAT[];
  anomalies: Anomaly[];
  currencies: string[];
  diagnostic: DiagnosticInfo;
  // New detailed breakdown by regime
  unionOSS: RegimeData;
  regular: RegimeData;
  voec: RegimeData;
  empty: RegimeData;
}

// Helper: Clean headers (remove BOM, quotes, trailing "", etc.)
function cleanHeaders(header: string): string {
  return header
    .replace(/^[\uFEFF\xEF\xBB\xBF]+/, '') // Remove BOM
    .replace(/"+$/, '') // Remove trailing quotes (e.g., ACTIVITY_PERIOD"")
    .replace(/^"+/, '') // Remove leading quotes
    .replace(/"/g, '') // Remove remaining quotes
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

// Normalize country to ISO 2-letter code
function normalizeCountry(country: string): string {
  if (!country) return '';
  
  const cleaned = country.trim().toUpperCase();
  
  // Already a 2-letter code
  if (/^[A-Z]{2}$/.test(cleaned)) {
    return cleaned;
  }
  
  // Look up in mapping
  if (COUNTRY_CODES[cleaned]) {
    return COUNTRY_CODES[cleaned];
  }
  
  // Try to extract 2-letter code from longer string
  const match = cleaned.match(/\b([A-Z]{2})\b/);
  if (match) {
    return match[1];
  }
  
  return cleaned.substring(0, 2); // Fallback
}

// Check if VAT number is plausible (format: XX + alphanumeric)
function isVatPlausible(vat: string): boolean {
  if (!vat) return false;
  const cleaned = vat.trim().toUpperCase();
  return /^[A-Z]{2}[A-Z0-9]{2,}$/.test(cleaned);
}

// Parse CSV line with RFC-compliant quote handling
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
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

// Detect CSV delimiter with proper quote handling
function detectDelimiter(content: string): { delimiter: string; confidence: number } {
  const lines = content.split('\n').slice(0, 10).filter(l => l.trim());
  const delimiters = ['\t', ';', ','];
  const results: Array<{ delimiter: string; avgCols: number; consistency: number }> = [];
  
  for (const delim of delimiters) {
    const colCounts: number[] = [];
    
    for (const line of lines) {
      // Use proper CSV parsing to respect quotes
      const cols = parseCSVLine(line, delim).length;
      colCounts.push(cols);
    }
    
    if (colCounts.length === 0) continue;
    
    const avgCols = colCounts.reduce((a, b) => a + b, 0) / colCounts.length;
    const mostCommonCount = Math.max(...colCounts.map(c => 
      colCounts.filter(x => x === c).length
    ));
    const mostCommon = colCounts.find(c => 
      colCounts.filter(x => x === c).length === mostCommonCount
    ) || 0;
    
    const consistency = colCounts.filter(c => c === mostCommon).length / colCounts.length;
    
    results.push({ delimiter: delim, avgCols, consistency });
  }
  
  // Sort by: 1) column count > 10, 2) consistency, 3) column count
  results.sort((a, b) => {
    const aValid = a.avgCols > 10 ? 1 : 0;
    const bValid = b.avgCols > 10 ? 1 : 0;
    if (aValid !== bValid) return bValid - aValid;
    if (Math.abs(a.consistency - b.consistency) > 0.1) return b.consistency - a.consistency;
    return b.avgCols - a.avgCols;
  });
  
  const best = results[0];
  return best && best.avgCols > 10
    ? { delimiter: best.delimiter, confidence: best.consistency }
    : { delimiter: '\t', confidence: 0.5 }; // Default to TAB if uncertain
}

// Parse CSV content with robust delimiter detection

function parseCSV(content: string, delimiter: string): { rows: CSVRow[]; headers: string[] } {
  const lines = content.split('\n');
  if (lines.length < 2) return { rows: [], headers: [] };

  // Clean and parse headers
  const rawHeaders = parseCSVLine(lines[0], delimiter);
  const headers = rawHeaders.map(cleanHeaders).filter(h => h.length > 0);
  
  console.log(`First 5 raw headers: ${rawHeaders.slice(0, 5).join(' | ')}`);
  console.log(`Parsed ${headers.length} headers after cleaning`);
  
  // Remove duplicate headers by adding index
  const seenHeaders = new Map<string, number>();
  const uniqueHeaders = headers.map(h => {
    const count = seenHeaders.get(h) || 0;
    seenHeaders.set(h, count + 1);
    return count > 0 ? `${h}_${count}` : h;
  });

  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line, delimiter);
    
    // Skip if not enough values
    if (values.length < Math.min(5, uniqueHeaders.length)) continue;
    
    const row: CSVRow = {};
    
    uniqueHeaders.forEach((header, index) => {
      if (header) {
        row[header] = values[index]?.replace(/^"|"$/g, '').trim() || '';
      }
    });
    
    // Only keep rows with some data
    if (Object.values(row).some(v => v)) {
      rows.push(row);
    }
  }

  return { rows, headers: uniqueHeaders };
}

// Parse amount - handle various decimal formats (comma/dot)
function parseAmount(value: string): number {
  if (!value) return 0;
  // Replace comma with dot, remove spaces and other non-numeric chars except - and .
  const cleaned = value.replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Map CSV columns to transaction structure
function mapColumns(row: CSVRow): Partial<ProcessedTransaction> {
  const htAmount = parseAmount(
    row['TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL'] || 
    row['TOTAL_ACTIVITY_VALUE_AMOUNT_VAT_EXCL'] ||
    row['HT'] || 
    row['NET_AMOUNT'] || 
    '0'
  );
  
  const vatAmount = parseAmount(
    row['TOTAL_ACTIVITY_VALUE_VAT_AMT'] || 
    row['TOTAL_ACTIVITY_VALUE_VAT_AMOUNT'] ||
    row['TVA'] || 
    row['VAT_AMOUNT'] ||
    '0'
  );
  
  // Get transaction type
  let txType = (
    row['TRANSACTION_TYPE'] || 
    row['TX_TYPE'] || 
    row['TYPE'] ||
    'SALE'
  ).toUpperCase();
  
  // Normalize transaction type
  if (txType.includes('REFUND') || txType.includes('RETURN')) {
    txType = 'REFUND';
  } else if (txType.includes('SALE')) {
    txType = 'SALE';
  }
  
  // Filter only SALE/REFUND transactions
  if (!['SALE', 'REFUND'].includes(txType)) {
    return {};
  }
  
  // REFUND should have negative amounts
  const multiplier = txType === 'REFUND' ? -1 : 1;
  const finalHt = Math.abs(htAmount) * multiplier;
  const finalVat = Math.abs(vatAmount) * multiplier;
  
  // Get arrival country with fallback
  let arrivalCountry = 
    row['SALE_ARRIVAL_COUNTRY'] || 
    row['ARRIVAL_COUNTRY'] ||
    row['DESTINATION_COUNTRY'] ||
    row['SHIP_TO_COUNTRY'] ||
    row['BUYER_COUNTRY'] ||
    row['TAXABLE_JURISDICTION'] ||
    '';
  
  // Try any column ending with _COUNTRY or _COUNTRY_CODE
  if (!arrivalCountry) {
    const countryCol = Object.keys(row).find(k => 
      k.endsWith('_COUNTRY') || k.endsWith('_COUNTRY_CODE')
    );
    if (countryCol) arrivalCountry = row[countryCol];
  }
  
  arrivalCountry = normalizeCountry(arrivalCountry);
  
  const departCountry = normalizeCountry(
    row['SALE_DEPART_COUNTRY'] || 
    row['DEPART_COUNTRY'] || 
    row['DEPARTURE_COUNTRY'] ||
    row['WAREHOUSE_COUNTRY'] ||
    ''
  );

  return {
    TX_EVENT_ID: row['TRANSACTION_EVENT_ID'] || row['TX_EVENT_ID'],
    TX_TYPE: txType as 'SALE' | 'REFUND',
    HT: finalHt,
    TVA: finalVat,
    ARRIVAL_COUNTRY: arrivalCountry,
    DEPART_COUNTRY: departCountry,
    BUYER_VAT: row['BUYER_VAT_NUMBER'] || row['BUYER_VAT'] || '',
    TAX_SCHEME: row['TAX_REPORTING_SCHEME'] || row['TAX_SCHEME'] || '',
    TAX_RESP: row['TAX_COLLECTION_RESPONSIBILITY'] || row['TAX_RESP'] || '',
    CURRENCY: row['CURRENCY'] || row['TRANSACTION_CURRENCY_CODE'] || 'EUR'
  };
}

// Categorize transaction based on business rules (priority order)
function categorize(tx: Partial<ProcessedTransaction>): string {
  const arrival = tx.ARRIVAL_COUNTRY || '';
  const depart = tx.DEPART_COUNTRY || '';
  const buyerVAT = tx.BUYER_VAT || '';
  const taxScheme = tx.TAX_SCHEME || '';

  const isEU = EU_COUNTRIES.has(arrival);
  const hasVat = isVatPlausible(buyerVAT);

  // Rule 1: EXPORT (non-EU destination)
  if (arrival && !isEU) {
    return 'EXPORT';
  }

  // Rule 2: INTRACOM B2B (EU with valid VAT number)
  if (isEU && hasVat) {
    return 'INTRACOM B2B';
  }

  // Rule 3: REGULAR (domestic - same arrival and depart country)
  if (arrival && depart && arrival === depart) {
    return 'REGULAR';
  }
  
  // Also REGULAR if tax scheme indicates domestic
  if (taxScheme && (taxScheme.includes('DOMESTIC') || taxScheme.includes('LOCAL'))) {
    return 'REGULAR';
  }

  // Rule 4: OSS (EU B2C cross-border)
  if (isEU && !hasVat) {
    return 'OSS';
  }

  // Rule 5: Everything else needs verification
  return 'A_VERIFIER';
}

// Consolidate transactions by country and category
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

  // Sort by country then category
  rows.sort((a, b) => {
    if (a.pays !== b.pays) return a.pays.localeCompare(b.pays);
    return a.categorie.localeCompare(b.categorie);
  });

  // Add total row
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

// Get domestic VAT for target countries (FR, DE, ES, IT)
function getDomesticVAT(transactions: ProcessedTransaction[]): DomesticVAT[] {
  const regular = transactions.filter(tx => tx.CATEGORIE === 'REGULAR');
  const map = new Map<string, DomesticVAT>();

  // Initialize target countries even if 0
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

// Get OSS VAT by country + TOTAL OSS row
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

  // Add TOTAL OSS row
  const total: OSSVAT = {
    pays: 'TOTAL OSS',
    tva: Math.round(rows.reduce((sum, r) => sum + r.tva, 0) * 100) / 100,
    ca_ht: Math.round(rows.reduce((sum, r) => sum + r.ca_ht, 0) * 100) / 100,
    transactions: rows.reduce((sum, r) => sum + r.transactions, 0)
  };
  rows.push(total);

  return rows;
}

// Detect anomalies in transactions
function detectAnomalies(transactions: ProcessedTransaction[]): Anomaly[] {
  const anomalies: Anomaly[] = [];

  transactions.forEach(tx => {
    // B2B with missing/invalid VAT
    if (tx.CATEGORIE === 'INTRACOM B2B' && !isVatPlausible(tx.BUYER_VAT || '')) {
      anomalies.push({
        type: 'B2B_VAT_MANQUANT',
        description: `Ligne B2B sans numéro TVA valide: ${tx.ARRIVAL_COUNTRY}`,
        tx_event_id: tx.TX_EVENT_ID
      });
    }

    // Missing arrival country
    if (!tx.ARRIVAL_COUNTRY) {
      anomalies.push({
        type: 'PAYS_MANQUANT',
        description: 'Ligne sans pays d\'arrivée',
        tx_event_id: tx.TX_EVENT_ID
      });
    }

    // VAT > 0 for INTRACOM/EXPORT (should be 0)
    if ((tx.CATEGORIE === 'INTRACOM B2B' || tx.CATEGORIE === 'EXPORT') && tx.TVA > 0.01) {
      anomalies.push({
        type: 'TVA_ANORMALE',
        description: `TVA > 0 pour ${tx.CATEGORIE}: ${tx.ARRIVAL_COUNTRY} (${tx.TVA.toFixed(2)}€)`,
        tx_event_id: tx.TX_EVENT_ID
      });
    }

    // REGULAR but different countries
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

// Generate diagnostic information
function generateDiagnostic(rows: CSVRow[], headers: string[], delimiter: string): DiagnosticInfo {
  const columns: Array<{ name: string; samples: string[] }> = [];
  
  // Get first 3 non-empty values for each column
  for (const header of headers.slice(0, 20)) { // Limit to first 20 columns
    const samples: string[] = [];
    for (const row of rows) {
      if (samples.length >= 3) break;
      const value = row[header];
      if (value && value.trim()) {
        samples.push(value.substring(0, 50)); // Limit length
      }
    }
    columns.push({ name: header, samples });
  }
  
  return {
    columns,
    rowCount: rows.length,
    delimiter: delimiter === '\t' ? 'TAB' : delimiter === ';' ? 'POINT-VIRGULE' : 'VIRGULE'
  };
}

// Generate detailed regime breakdown
function generateRegimeBreakdown(transactions: ProcessedTransaction[]): {
  unionOSS: RegimeData;
  regular: RegimeData;
  voec: RegimeData;
  empty: RegimeData;
} {
  const regimes: { [key: string]: Map<string, { sale: TransactionDetail; refund: TransactionDetail }> } = {
    unionOSS: new Map(),
    regular: new Map(),
    voec: new Map(),
    empty: new Map()
  };

  // Categorize transactions
  transactions.forEach(tx => {
    let regime: string;
    
    if (!tx.ARRIVAL_COUNTRY || tx.CATEGORIE === 'A_VERIFIER') {
      regime = 'empty';
    } else if (tx.CATEGORIE === 'OSS') {
      regime = 'unionOSS';
    } else if (tx.CATEGORIE === 'REGULAR') {
      regime = 'regular';
    } else if (tx.TAX_SCHEME?.includes('VOEC') || tx.ARRIVAL_COUNTRY === 'CH') {
      regime = 'voec';
    } else {
      regime = 'empty';
    }

    const country = tx.ARRIVAL_COUNTRY || 'NO COUNTRY';
    
    if (!regimes[regime].has(country)) {
      regimes[regime].set(country, {
        sale: { type: 'SALE', total: 0, base: 0, vat: 0, currency: tx.CURRENCY },
        refund: { type: 'REFUND', total: 0, base: 0, vat: 0, currency: tx.CURRENCY }
      });
    }

    const countryData = regimes[regime].get(country)!;
    const detail = tx.TX_TYPE === 'SALE' ? countryData.sale : countryData.refund;
    
    detail.base += tx.HT;
    detail.vat += tx.TVA;
    detail.total += tx.HT + tx.TVA;
  });

  // Convert to RegimeData structure
  const result: any = {};
  
  for (const [regimeName, countryMap] of Object.entries(regimes)) {
    const countries: CountryDetail[] = [];
    let totalBase = 0;
    let totalVat = 0;
    let totalTTC = 0;

    for (const [country, data] of countryMap.entries()) {
      const base = Math.round((data.sale.base + data.refund.base) * 100) / 100;
      const vat = Math.round((data.sale.vat + data.refund.vat) * 100) / 100;
      const total = Math.round((data.sale.total + data.refund.total) * 100) / 100;

      const details: TransactionDetail[] = [];
      
      // Add SALE if exists
      if (data.sale.total !== 0) {
        details.push({
          type: 'SALE',
          total: Math.round(data.sale.total * 100) / 100,
          base: Math.round(data.sale.base * 100) / 100,
          vat: Math.round(data.sale.vat * 100) / 100,
          currency: data.sale.currency
        });
      }
      
      // Add REFUND if exists
      if (data.refund.total !== 0) {
        details.push({
          type: 'REFUND',
          total: Math.round(data.refund.total * 100) / 100,
          base: Math.round(data.refund.base * 100) / 100,
          vat: Math.round(data.refund.vat * 100) / 100,
          currency: data.refund.currency
        });
      }

      if (total !== 0) {
        countries.push({
          country,
          total,
          base,
          vat,
          currency: data.sale.currency,
          details
        });

        totalBase += base;
        totalVat += vat;
        totalTTC += total;
      }
    }

    // Sort countries by name
    countries.sort((a, b) => a.country.localeCompare(b.country));

    result[regimeName] = {
      countries,
      totalBase: Math.round(totalBase * 100) / 100,
      totalVat: Math.round(totalVat * 100) / 100,
      totalTTC: Math.round(totalTTC * 100) / 100
    };
  }

  return result as any;
}

// Main processing function
export function processAdvancedVAT(csvContent: string): AdvancedVATReport {
  // Step 1: Detect delimiter
  const { delimiter, confidence } = detectDelimiter(csvContent);
  
  console.log(`Detected delimiter: ${delimiter === '\t' ? 'TAB' : delimiter} (confidence: ${(confidence * 100).toFixed(1)}%)`);
  
  // Step 2: Parse CSV with detected delimiter
  const { rows, headers } = parseCSV(csvContent, delimiter);
  
  console.log(`Parsed ${rows.length} rows with ${headers.length} columns`);
  
  // Step 3: Generate diagnostic
  const diagnostic = generateDiagnostic(rows, headers, delimiter);
  
  // Step 4: Map and filter transactions
  const transactions: ProcessedTransaction[] = [];
  const currencies = new Set<string>();

  rows.forEach(row => {
    const mapped = mapColumns(row);
    
    // Filter: TX_TYPE valid, amounts present, country present
    if (!mapped.TX_TYPE || !mapped.ARRIVAL_COUNTRY) return;
    if (mapped.HT === undefined || mapped.TVA === undefined) return;

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

  console.log(`Mapped ${transactions.length} valid transactions`);

  // Step 5: Generate old reports (for compatibility)
  const consolidated = consolidate(transactions);
  const domestic = getDomesticVAT(transactions);
  const oss = getOSSVAT(transactions);
  const anomalies = detectAnomalies(transactions);
  
  // Step 6: Generate new detailed breakdown
  const { unionOSS, regular, voec, empty } = generateRegimeBreakdown(transactions);

  return {
    consolidated,
    domesticVAT: domestic,
    ossVAT: oss,
    anomalies,
    currencies: Array.from(currencies),
    diagnostic,
    unionOSS,
    regular,
    voec,
    empty
  };
}
