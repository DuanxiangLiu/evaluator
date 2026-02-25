export const normalCDF = (x) => {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
};

export const calculateWilcoxonPValue = (diffs) => {
  const nonZeroDiffs = diffs.filter(d => d !== 0);
  const n = nonZeroDiffs.length;
  if (n === 0) return 1.0;
  
  const absDiffs = nonZeroDiffs.map(d => ({ val: d, abs: Math.abs(d) })).sort((a, b) => a.abs - b.abs);
  let wPlus = 0, wMinus = 0;
  
  absDiffs.forEach((d, i) => {
    const rank = i + 1;
    if (d.val > 0) wPlus += rank;
    else wMinus += rank;
  });
  
  const w = Math.min(wPlus, wMinus);
  const expectedW = (n * (n + 1)) / 4;
  const varianceW = (n * (n + 1) * (2 * n + 1)) / 24;
  
  if (varianceW === 0) return 1.0;
  
  const z = (w - expectedW) / Math.sqrt(varianceW);
  return 2 * (1 - normalCDF(Math.abs(z)));
};

export const quantile = (arr, q) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
};

export const formatIndustrialNumber = (val) => {
  if (val === null || val === undefined || val === '') return val;
  const num = Number(val);
  if (isNaN(num)) return val;
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
};

export const calculateImprovement = (baseVal, compareVal) => {
  if (baseVal == null || compareVal == null) return null;
  if (baseVal === 0 && compareVal === 0) return 0;
  if (baseVal === 0 && compareVal > 0) return -100;
  if (baseVal > 0) return ((baseVal - compareVal) / baseVal) * 100;
  return null;
};

export const calculateRatio = (baseVal, compareVal) => {
  if (baseVal == null || compareVal == null) return null;
  if (baseVal === 0 && compareVal === 0) return 1;
  if (baseVal === 0) return 2;
  return compareVal / baseVal;
};
