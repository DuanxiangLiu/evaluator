export const downloadFile = (content, filename, mimeType = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadCSV = (csvContent, filename) => {
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
};

export const downloadJSON = (jsonContent, filename) => {
  downloadFile(JSON.stringify(jsonContent, null, 2), filename, 'application/json');
};

export const downloadTSV = (tsvContent, filename) => {
  downloadFile('\ufeff' + tsvContent, filename, 'text/plain;charset=utf-8;');
};
