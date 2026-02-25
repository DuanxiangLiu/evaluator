export const formatIndustrialNumber = (val) => {
  if (val === null || val === undefined || val === '') return val;
  const num = Number(val);
  if (isNaN(num)) return val;
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
};

export const formatPercentage = (value, decimals = 2) => {
  if (value == null) return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  return `${num > 0 ? '+' : ''}${num.toFixed(decimals)}%`;
};

export const formatNumber = (value, decimals = 2) => {
  if (value == null) return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  return num.toFixed(decimals);
};
