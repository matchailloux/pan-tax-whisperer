import { VATBreakdownData } from "@/components/VATBreakdown";
import { CSVRow } from "./vatProcessor";

/**
 * Moteur de règles TVA Amazon
 * 
 * Objectif : Ventiler la TVA par type de vente et par pays à partir du rapport Amazon
 * 
 * Règles générales :
 * - Filtrer uniquement TRANSACTION_TYPE ∈ { "SALES", "REFUND" }
 * - Calculer tous les totaux dans TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL
 * 
 * Types de ventes :
 * - OSS : TAX_REPORTING_SCHEME = "UNION-OSS", groupé par SALE_ARRIVAL_COUNTRY
 * - Domestique B2C : REGULAR + BUYER_VAT_NUMBER_COUNTRY vide
 * - Domestique B2B : SALE_DEPART_COUNTRY = BUYER_VAT_NUMBER_COUNTRY 
 * - Intracommunautaire : SALE_DEPART_COUNTRY ≠ BUYER_VAT_NUMBER_COUNTRY (non vide)
 */

export interface AmazonVATRow extends CSVRow {
  // Colonnes essentielles pour les règles TVA
  'TRANSACTION_TYPE'?: string;
  'TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL'?: string;
  'TAX_REPORTING_SCHEME'?: string;
  'SALE_ARRIVAL_COUNTRY'?: string;
  'SALE_DEPART_COUNTRY'?: string;
  'BUYER_VAT_NUMBER_COUNTRY'?: string;
  'BUYER_VAT_NUMBER'?: string;
  
  // Colonnes additionnelles pour le contexte
  'ACTIVITY_PERIOD'?: string;
  'SALES_CHANNEL'?: string;
  'MARKETPLACE'?: string;
  'SELLER_SKU'?: string;
  'ASIN'?: string;
  'TRANSACTION_CURRENCY_CODE'?: string;
}

const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

const MARKETPLACE_COUNTRY_MAP: { [key: string]: string } = {
  'amazon.de': 'DE',
  'amazon.fr': 'FR',
  'amazon.it': 'IT',
  'amazon.es': 'ES',
  'amazon.nl': 'NL',
  'amazon.pl': 'PL',
  'amazon.se': 'SE',
  'amazon.be': 'BE',
  'amazon.at': 'AT',
  'amazon.cz': 'CZ'
};

/**
 * Processeur principal du rapport Amazon VAT
 * Applique les règles de ventilation et produit la synthèse attendue
 */
export function processAmazonVATReport(csvContent: string): VATBreakdownData[] {
  const rows = parseAmazonCSV(csvContent);
  const countryBreakdown: { [country: string]: VATBreakdownData } = {};

  console.log(`🔍 Analyse de ${rows.length} lignes du rapport Amazon VAT`);

  rows.forEach((row, index) => {
    // RÈGLE GÉNÉRALE 1: Filtrer uniquement les SALES et REFUND
    const transactionType = (row['TRANSACTION_TYPE'] || '').toUpperCase().trim();
    if (!['SALES', 'REFUND'].includes(transactionType)) {
      return; // Ignorer les autres types de transactions
    }

    // RÈGLE GÉNÉRALE 2: Extraire le montant de TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL
    const vatAmount = extractVATAmount(row);
    if (vatAmount === 0) {
      return; // Ignorer les transactions sans montant
    }

    // Analyser la transaction selon les règles de ventilation
    const analysis = analyzeTransactionByRules(row);
    if (!analysis) {
      console.warn(`❌ Ligne ${index + 2}: Transaction non classifiable`, {
        scheme: row['TAX_REPORTING_SCHEME'],
        departCountry: row['SALE_DEPART_COUNTRY'],
        arrivalCountry: row['SALE_ARRIVAL_COUNTRY'],
        buyerCountry: row['BUYER_VAT_NUMBER_COUNTRY']
      });
      return;
    }

    const { country, vatType } = analysis;

    // Initialiser le pays s'il n'existe pas
    if (!countryBreakdown[country]) {
      countryBreakdown[country] = {
        country,
        localB2C: 0,    // Ventes domestiques B2C
        localB2B: 0,    // Ventes domestiques B2B
        intracommunautaire: 0, // Ventes intracommunautaires
        oss: 0,         // Ventes OSS
        total: 0
      };
    }

    // Ventiler selon le type déterminé
    switch (vatType) {
      case 'DOMESTIC_B2C':
        countryBreakdown[country].localB2C += vatAmount;
        break;
      case 'DOMESTIC_B2B':
        countryBreakdown[country].localB2B += vatAmount;
        break;
      case 'INTRACOMMUNAUTAIRE':
        countryBreakdown[country].intracommunautaire += vatAmount;
        break;
      case 'OSS':
        countryBreakdown[country].oss += vatAmount;
        break;
    }

    countryBreakdown[country].total += vatAmount;
  });

  const result = Object.values(countryBreakdown);
  console.log('📊 Synthèse TVA générée:', {
    pays: result.length,
    totalOSS: result.reduce((sum, c) => sum + c.oss, 0),
    totalDomestique: result.reduce((sum, c) => sum + c.localB2C + c.localB2B, 0),
    totalIntracommunautaire: result.reduce((sum, c) => sum + c.intracommunautaire, 0)
  });

  return result;
}

function parseAmazonCSV(csvContent: string): AmazonVATRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Gérer les fichiers avec BOM UTF-8
  const firstLine = lines[0].replace(/^\uFEFF/, '');
  const headers = parseCSVLine(firstLine);
  const rows: AmazonVATRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: AmazonVATRow = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }

  return rows;
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

/**
 * Extraction du montant TVA selon la règle générale
 * Utilise uniquement TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL
 */
function extractVATAmount(row: AmazonVATRow): number {
  const value = row['TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL'];
  if (value) {
    const amount = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (!isNaN(amount)) {
      return amount; // Conserver le signe: les REFUND (montants négatifs) réduisent les totaux
    }
  }
  return 0;
}

interface TransactionAnalysis {
  country: string;
  vatType: 'DOMESTIC_B2C' | 'DOMESTIC_B2B' | 'INTRACOMMUNAUTAIRE' | 'OSS';
}

/**
 * Moteur de règles principal
 * Analyse chaque transaction selon les 4 règles de ventilation
 */
function analyzeTransactionByRules(row: AmazonVATRow): TransactionAnalysis | null {
  const taxReportingScheme = (row['TAX_REPORTING_SCHEME'] || '').toUpperCase().trim();
  const saleArrivalCountry = normalizeCountryCode(row['SALE_ARRIVAL_COUNTRY'] || '');
  const saleDepartCountry = normalizeCountryCode(row['SALE_DEPART_COUNTRY'] || '');
  const buyerVatNumberCountry = normalizeCountryCode(row['BUYER_VAT_NUMBER_COUNTRY'] || '');
  const buyerVatNumber = (row['BUYER_VAT_NUMBER'] || '').trim();

  // RÈGLE 1: Ventes OSS (Union-OSS)
  // Condition: TAX_REPORTING_SCHEME = "UNION-OSS"
  // Groupement: SALE_ARRIVAL_COUNTRY
  if (taxReportingScheme === 'UNION-OSS') {
    if (saleArrivalCountry) {
      return { country: saleArrivalCountry, vatType: 'OSS' };
    }
    return null; // OSS sans pays d'arrivée = invalide
  }

  // RÈGLES 2-4: Ventes REGULAR (domestique B2C, domestique B2B, intracommunautaire)
  if (taxReportingScheme === 'REGULAR' && saleDepartCountry) {
    
    // RÈGLE 2: Ventes domestiques B2C
    // Conditions: REGULAR + SALE_DEPART_COUNTRY défini + BUYER_VAT_NUMBER_COUNTRY vide
    if (!buyerVatNumberCountry) {
      return { country: saleDepartCountry, vatType: 'DOMESTIC_B2C' };
    }
    
    // RÈGLE 3: Ventes domestiques B2B  
    // Conditions: SALE_DEPART_COUNTRY = BUYER_VAT_NUMBER_COUNTRY
    if (buyerVatNumberCountry === saleDepartCountry) {
      return { country: saleDepartCountry, vatType: 'DOMESTIC_B2B' };
    }
    
    // RÈGLE 4: Ventes intracommunautaires
    // Conditions: SALE_DEPART_COUNTRY ≠ BUYER_VAT_NUMBER_COUNTRY (non vide)
    if (buyerVatNumberCountry && buyerVatNumberCountry !== saleDepartCountry) {
      return { country: saleDepartCountry, vatType: 'INTRACOMMUNAUTAIRE' };
    }
  }

  return null; // Transaction non classifiable
}

/**
 * Normalisation des codes pays
 * Convertit les noms de pays et codes vers le format ISO 2 lettres
 */
function normalizeCountryCode(countryString: string): string | null {
  const country = countryString.trim().toUpperCase();
  
  // Mapping des noms de pays vers codes ISO
  const countryMapping: { [key: string]: string } = {
    'GERMANY': 'DE',
    'FRANCE': 'FR', 
    'ITALY': 'IT',
    'SPAIN': 'ES',
    'NETHERLANDS': 'NL',
    'POLAND': 'PL',
    'SWEDEN': 'SE',
    'BELGIUM': 'BE',
    'AUSTRIA': 'AT',
    'CZECH REPUBLIC': 'CZ',
    'CZECHIA': 'CZ',
    'DENMARK': 'DK',
    'FINLAND': 'FI',
    'GREECE': 'GR',
    'HUNGARY': 'HU',
    'IRELAND': 'IE',
    'LATVIA': 'LV',
    'LITHUANIA': 'LT',
    'LUXEMBOURG': 'LU',
    'MALTA': 'MT',
    'PORTUGAL': 'PT',
    'ROMANIA': 'RO',
    'SLOVAKIA': 'SK',
    'SLOVENIA': 'SI',
    'ESTONIA': 'EE',
    'BULGARIA': 'BG',
    'CROATIA': 'HR',
    'CYPRUS': 'CY'
  };

  // Si c'est déjà un code à 2 lettres valide
  if (country.length === 2 && EU_COUNTRIES.includes(country)) {
    return country;
  }

  // Sinon chercher dans le mapping
  return countryMapping[country] || null;
}

/**
 * Utilitaire pour déterminer le pays depuis la marketplace (optionnel)
 */
function getMarketplaceCountry(marketplace: string): string | null {
  const marketplaceLower = marketplace.toLowerCase();
  
  for (const [marketplaceUrl, country] of Object.entries(MARKETPLACE_COUNTRY_MAP)) {
    if (marketplaceLower.includes(marketplaceUrl)) {
      return country;
    }
  }
  
  return null;
}