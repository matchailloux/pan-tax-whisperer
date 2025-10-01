import * as XLSX from 'xlsx';
import { DetailedVATReport } from './newYAMLVATEngine';

export function exportVATReportToExcel(report: DetailedVATReport, fileName: string = 'analyse_tva') {
  const wb = XLSX.utils.book_new();

  // Helper pour formater les montants
  const formatAmount = (num: number) => {
    return typeof num === 'number' ? Number(num.toFixed(2)) : 0;
  };

  // 1. Onglet "Résumé KPIs"
  const kpiData = report.kpiCards.map(kpi => ({
    'Indicateur': kpi.title,
    'Montant (€)': formatAmount(kpi.amount),
    'Nombre de Transactions': kpi.count
  }));
  const wsKPI = XLSX.utils.json_to_sheet(kpiData);
  XLSX.utils.book_append_sheet(wb, wsKPI, 'Résumé KPIs');

  // 2. Onglet "Déclaration OSS"
  if (report.vatDeclaration?.oss.length > 0) {
    const ossData: any[] = [];
    report.vatDeclaration.oss.forEach(country => {
      country.rates.forEach(rate => {
        ossData.push({
          'Pays': country.country,
          'Taux TVA (%)': formatAmount(rate.rate),
          'Base HT (€)': formatAmount(rate.base),
          'TVA Due (€)': formatAmount(rate.vat),
          'Transactions': rate.transactions
        });
      });
      // Ligne de total par pays
      ossData.push({
        'Pays': `TOTAL ${country.country}`,
        'Taux TVA (%)': '',
        'Base HT (€)': formatAmount(country.totalBase),
        'TVA Due (€)': formatAmount(country.totalVAT),
        'Transactions': country.totalTransactions
      });
    });
    // Total global OSS
    ossData.push({
      'Pays': 'TOTAL OSS À DÉCLARER',
      'Taux TVA (%)': '',
      'Base HT (€)': formatAmount(report.vatDeclaration.totalOSS.base),
      'TVA Due (€)': formatAmount(report.vatDeclaration.totalOSS.vat),
      'Transactions': report.vatDeclaration.totalOSS.transactions
    });
    const wsOSS = XLSX.utils.json_to_sheet(ossData);
    XLSX.utils.book_append_sheet(wb, wsOSS, 'Déclaration OSS');
  }

  // 3. Onglet "Déclarations Nationales"
  if (report.vatDeclaration?.regular.length > 0) {
    const regularData: any[] = [];
    report.vatDeclaration.regular.forEach(country => {
      country.rates.forEach(rate => {
        regularData.push({
          'Pays': country.country,
          'Taux TVA (%)': formatAmount(rate.rate),
          'Base HT (€)': formatAmount(rate.base),
          'TVA Due (€)': formatAmount(rate.vat),
          'Transactions': rate.transactions
        });
      });
      // Ligne de total par pays
      regularData.push({
        'Pays': `TOTAL ${country.country}`,
        'Taux TVA (%)': '',
        'Base HT (€)': formatAmount(country.totalBase),
        'TVA Due (€)': formatAmount(country.totalVAT),
        'Transactions': country.totalTransactions
      });
    });
    // Total global REGULAR
    regularData.push({
      'Pays': 'TOTAL REGULAR À DÉCLARER',
      'Taux TVA (%)': '',
      'Base HT (€)': formatAmount(report.vatDeclaration.totalRegular.base),
      'TVA Due (€)': formatAmount(report.vatDeclaration.totalRegular.vat),
      'Transactions': report.vatDeclaration.totalRegular.transactions
    });
    const wsRegular = XLSX.utils.json_to_sheet(regularData);
    XLSX.utils.book_append_sheet(wb, wsRegular, 'Déclarations Nationales');
  }

  // 4. Onglet "Ventilation par Régime"
  const regimeData = [
    { label: 'OSS', match: (t: string) => t.includes('OSS') },
    { label: 'Domestique B2C', match: (t: string) => t.includes('B2C') },
    { label: 'Domestique B2B', match: (t: string) => t.includes('B2B') },
    { label: 'Intracommunautaire', match: (t: string) => t.includes('Intracommunautaire') },
    { label: 'Suisse (VOEC)', match: (t: string) => t.includes('Suisse') || t.includes('VOEC') },
    { label: 'Autre', match: (t: string) => t.includes('Autre') },
  ].map(({ label, match }) => {
    const kpi = report.kpiCards.find((k) => match(k.title)) || { amount: 0, count: 0 };
    return {
      'Régime': label,
      'Montant HT (€)': formatAmount(kpi.amount),
      'Transactions': kpi.count || 0
    };
  });
  const wsRegime = XLSX.utils.json_to_sheet(regimeData);
  XLSX.utils.book_append_sheet(wb, wsRegime, 'Ventilation par Régime');

  // 5. Onglet "Ventilation par Pays"
  const paysData = report.breakdown.map(row => ({
    'Pays': row.country,
    'OSS (€)': row.oss !== 0 ? formatAmount(row.oss) : 0,
    'B2C (€)': row.domesticB2C !== 0 ? formatAmount(row.domesticB2C) : 0,
    'B2B (€)': row.domesticB2B !== 0 ? formatAmount(row.domesticB2B) : 0,
    'Intracommunautaire (€)': row.intracommunautaire !== 0 ? formatAmount(row.intracommunautaire) : 0,
    'Suisse VOEC (€)': row.suisse !== 0 ? formatAmount(row.suisse) : 0,
    'Autre (€)': row.residuel !== 0 ? formatAmount(row.residuel) : 0,
    'Total (€)': formatAmount(row.total)
  }));
  const wsPays = XLSX.utils.json_to_sheet(paysData);
  XLSX.utils.book_append_sheet(wb, wsPays, 'Ventilation par Pays');

  // 6. Onglet "Sanity Check Global"
  const sanityGlobalData = [
    { 'Métrique': 'Grand Total', 'Montant (€)': formatAmount(report.sanityCheckGlobal.grandTotal) },
    { 'Métrique': 'OSS Total', 'Montant (€)': formatAmount(report.sanityCheckGlobal.ossTotal) },
    { 'Métrique': 'REGULAR Total', 'Montant (€)': formatAmount(report.sanityCheckGlobal.regularTotal) },
    { 'Métrique': 'Δ GT − (OSS+REG)', 'Montant (€)': formatAmount(report.sanityCheckGlobal.diffGrandTotalVsSum) },
    { 'Métrique': 'Δ REG − (B2C+B2B+Intra)', 'Montant (€)': formatAmount(report.sanityCheckGlobal.diffRegularVsComponents) },
    { 'Métrique': 'Validation', 'Montant (€)': report.sanityCheckGlobal.isValid ? 'VALIDE ✓' : 'INVALIDE ✗' }
  ];
  const wsSanityGlobal = XLSX.utils.json_to_sheet(sanityGlobalData);
  XLSX.utils.book_append_sheet(wb, wsSanityGlobal, 'Sanity Check Global');

  // 7. Onglet "Sanity Check par Pays"
  const invalidCountries = report.sanityCheckByCountry.filter(c => !c.isValid);
  if (invalidCountries.length > 0) {
    const sanityPaysData = invalidCountries.map(check => ({
      'Pays': check.country,
      'REGULAR Total (€)': formatAmount(check.regularTotal),
      'B2C (€)': formatAmount(check.b2cTotal),
      'B2B (€)': formatAmount(check.b2bTotal),
      'Intracommunautaire (€)': formatAmount(check.intracomTotal),
      'Différence (€)': formatAmount(check.difference),
      'Valide': check.isValid ? 'OUI' : 'NON'
    }));
    const wsSanityPays = XLSX.utils.json_to_sheet(sanityPaysData);
    XLSX.utils.book_append_sheet(wb, wsSanityPays, 'Sanity Check Pays');
  }

  // 8. Onglet "Règles Appliquées"
  const rulesData = [
    { 'Règle': 'OSS', 'Nombre': report.rulesApplied.ossRules },
    { 'Règle': 'Domestique B2C', 'Nombre': report.rulesApplied.domesticB2CRules },
    { 'Règle': 'Domestique B2B', 'Nombre': report.rulesApplied.domesticB2BRules },
    { 'Règle': 'Intracommunautaire', 'Nombre': report.rulesApplied.intracommunautaireRules },
    { 'Règle': 'Suisse (VOEC)', 'Nombre': report.rulesApplied.suisseRules },
    { 'Règle': 'Autre', 'Nombre': report.rulesApplied.residuelRules },
    { 'Règle': 'TOTAL TRAITÉ', 'Nombre': report.rulesApplied.totalProcessed }
  ];
  const wsRules = XLSX.utils.json_to_sheet(rulesData);
  XLSX.utils.book_append_sheet(wb, wsRules, 'Règles Appliquées');

  // Générer et télécharger le fichier
  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${fileName}_${timestamp}.xlsx`);
}
