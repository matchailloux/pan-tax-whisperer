import { VATBreakdownData } from "@/components/VATBreakdown";
import { CSVRow } from "./vatProcessor";

export interface AmazonVATRow extends CSVRow {
  // Colonnes Amazon VAT selon la spécification utilisateur
  'TRANSACTION_TYPE'?: string;
  'TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL'?: string;
  'TAX_REPORTING_SCHEME'?: string;
  'SALE_ARRIVAL_COUNTRY'?: string;
  'SALE_DEPART_COUNTRY'?: string;
  'BUYER_VAT_NUMBER_COUNTRY'?: string;
  'BUYER_VAT_NUMBER'?: string;
  
  // Autres colonnes potentiellement utiles
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

export function processAmazonVATReport(csvContent: string): VATBreakdownData[] {
  const rows = parseAmazonCSV(csvContent);
  const countryBreakdown: { [country: string]: VATBreakdownData } = {};

  rows.forEach(row => {
    // Filtrer uniquement les SALES et REFUND
    const transactionType = row['TRANSACTION_TYPE'] || '';
    if (!['SALES', 'REFUND'].includes(transactionType)) return;

    const vatAmount = extractAmazonVATAmount(row);
    if (vatAmount === 0) return;

    const analysis = analyzeTransaction(row);
    if (!analysis) return;

    const { country, vatType } = analysis;

    if (!countryBreakdown[country]) {
      countryBreakdown[country] = {
        country,
        localB2C: 0,
        localB2B: 0,
        intracommunautaire: 0,
        oss: 0,
        total: 0
      };
    }

    // Ajouter le montant selon le type déterminé automatiquement
    switch (vatType) {
      case 'LOCAL_B2C':
        countryBreakdown[country].localB2C += vatAmount;
        break;
      case 'LOCAL_B2B':
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

  return Object.values(countryBreakdown);
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

function extractAmazonVATAmount(row: AmazonVATRow): number {
  // Utiliser la colonne spécifiée par l'utilisateur
  const value = row['TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL'];
  if (value) {
    const amount = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (!isNaN(amount)) {
      return Math.abs(amount);
    }
  }

  return 0;
}

interface TransactionAnalysis {
  country: string;
  vatType: 'LOCAL_B2C' | 'LOCAL_B2B' | 'INTRACOMMUNAUTAIRE' | 'OSS';
}

function analyzeTransaction(row: AmazonVATRow): TransactionAnalysis | null {
  const taxReportingScheme = row['TAX_REPORTING_SCHEME'] || '';
  const saleArrivalCountry = getCountryCode(row['SALE_ARRIVAL_COUNTRY'] || '');
  const saleDepartCountry = getCountryCode(row['SALE_DEPART_COUNTRY'] || '');
  const buyerVatNumberCountry = getCountryCode(row['BUYER_VAT_NUMBER_COUNTRY'] || '');
  const buyerVatNumber = row['BUYER_VAT_NUMBER'] || '';

  // Règle 1: Ventes OSS
  if (taxReportingScheme === 'UNION-OSS') {
    // Pour l'OSS, le pays est le pays d'arrivée
    if (saleArrivalCountry) {
      return { country: saleArrivalCountry, vatType: 'OSS' };
    }
  }

  // Règle 2: Ventes REGULAR (domestique B2C, domestique B2B, intracommunautaire)
  if (taxReportingScheme === 'REGULAR' && saleDepartCountry) {
    
    // Ventes domestiques B2C: BUYER_VAT_NUMBER_COUNTRY est vide
    if (!buyerVatNumberCountry || buyerVatNumberCountry === '' || buyerVatNumber.trim() === '') {
      return { country: saleDepartCountry, vatType: 'LOCAL_B2C' };
    }
    
    // Ventes domestiques B2B: SALE_DEPART_COUNTRY = BUYER_VAT_NUMBER_COUNTRY
    if (buyerVatNumberCountry === saleDepartCountry) {
      return { country: saleDepartCountry, vatType: 'LOCAL_B2B' };
    }
    
    // Ventes intracommunautaires: SALE_DEPART_COUNTRY ≠ BUYER_VAT_NUMBER_COUNTRY
    if (buyerVatNumberCountry && buyerVatNumberCountry !== saleDepartCountry) {
      return { country: saleDepartCountry, vatType: 'INTRACOMMUNAUTAIRE' };
    }
  }

  return null;
}

function getCountryCode(countryString: string): string | null {
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
    'CZECHIA': 'CZ'
  };

  // Si c'est déjà un code à 2 lettres
  if (country.length === 2 && EU_COUNTRIES.includes(country)) {
    return country;
  }

  // Sinon chercher dans le mapping
  return countryMapping[country] || null;
}

function getMarketplaceCountry(marketplace: string): string | null {
  const marketplaceLower = marketplace.toLowerCase();
  
  for (const [marketplaceUrl, country] of Object.entries(MARKETPLACE_COUNTRY_MAP)) {
    if (marketplaceLower.includes(marketplaceUrl)) {
      return country;
    }
  }
  
  return null;
}