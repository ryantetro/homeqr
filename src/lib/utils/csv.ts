// CSV export utility functions

export function convertToCSV(data: any[], headers: string[]): string {
  const csvRows: string[] = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      // Escape commas and quotes
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


