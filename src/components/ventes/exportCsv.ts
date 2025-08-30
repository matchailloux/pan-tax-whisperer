export function exportCsv(filename: string, rows: Record<string, any>[], headers?: string[]) {
  if (!rows?.length) return;
  
  const cols = headers ?? Object.keys(rows[0]);
  const escapeValue = (value: any) => {
    const str = (value ?? '').toString();
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const lines = [
    cols.join(','),
    ...rows.map(row => cols.map(col => escapeValue(row[col])).join(','))
  ];
  
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}