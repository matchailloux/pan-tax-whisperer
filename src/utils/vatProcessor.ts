import { VATRule } from "@/components/RulesConfig";
import { VATBreakdownData } from "@/components/VATBreakdown";

export interface CSVRow {
  [key: string]: string;
}

export function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: CSVRow = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }

  return rows;
}

export function applyVATRules(rows: CSVRow[], rules: VATRule[]): VATBreakdownData[] {
  const countryBreakdown: { [country: string]: VATBreakdownData } = {};

  rows.forEach(row => {
    // Trouver les colonnes contenant des montants de TVA
    const vatAmount = extractVATAmount(row);
    if (vatAmount === 0) return;

    // Appliquer les règles pour déterminer le type de TVA et le pays
    const matchedRule = findMatchingRule(row, rules);
    
    if (matchedRule) {
      const country = matchedRule.country;
      
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

      // Ajouter le montant selon le type de TVA
      switch (matchedRule.vatType) {
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
    }
  });

  return Object.values(countryBreakdown);
}

function extractVATAmount(row: CSVRow): number {
  // Chercher dans les colonnes communes pour les montants de TVA
  const vatColumns = [
    'vat_amount', 'tax_amount', 'vat', 'tax', 'tva', 'tva_montant',
    'VAT Amount', 'Tax Amount', 'Total Tax', 'VAT Total'
  ];

  for (const column of vatColumns) {
    const value = row[column];
    if (value) {
      const amount = parseFloat(value.replace(/[^\d.-]/g, ''));
      if (!isNaN(amount)) {
        return Math.abs(amount);
      }
    }
  }

  // Si aucune colonne spécifique trouvée, chercher toute colonne contenant un montant
  for (const [key, value] of Object.entries(row)) {
    if (key.toLowerCase().includes('vat') || key.toLowerCase().includes('tax') || key.toLowerCase().includes('tva')) {
      const amount = parseFloat(value.replace(/[^\d.-]/g, ''));
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }

  return 0;
}

function findMatchingRule(row: CSVRow, rules: VATRule[]): VATRule | null {
  for (const rule of rules) {
    let allConditionsMet = true;

    for (const condition of rule.conditions) {
      const cellValue = row[condition.column]?.toLowerCase() || '';
      const conditionValue = condition.value.toLowerCase();

      let conditionMet = false;
      switch (condition.operator) {
        case 'equals':
          conditionMet = cellValue === conditionValue;
          break;
        case 'contains':
          conditionMet = cellValue.includes(conditionValue);
          break;
        case 'starts_with':
          conditionMet = cellValue.startsWith(conditionValue);
          break;
      }

      if (!conditionMet) {
        allConditionsMet = false;
        break;
      }
    }

    if (allConditionsMet) {
      return rule;
    }
  }

  return null;
}