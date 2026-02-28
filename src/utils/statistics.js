import { NORMAL_CDF_COEFFICIENTS, Z_SCORE_95_PERCENT, OUTLIER_MULTIPLIER } from './constants';

export const normalCDF = (x) => {
  const { T_COEFFICIENT, D_COEFFICIENT, P_COEFFICIENTS } = NORMAL_CDF_COEFFICIENTS;
  const t = 1 / (1 + T_COEFFICIENT * Math.abs(x));
  const d = D_COEFFICIENT * Math.exp(-x * x / 2);
  const p = d * t * (P_COEFFICIENTS[0] + t * (P_COEFFICIENTS[1] + t * (P_COEFFICIENTS[2] + t * (P_COEFFICIENTS[3] + t * P_COEFFICIENTS[4]))));
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

export const calculateImprovement = (baseVal, compareVal) => {
  if (baseVal == null || compareVal == null) return null;
  if (baseVal === 0 && compareVal === 0) return 0;
  if (baseVal === 0) return -100;
  return ((baseVal - compareVal) / baseVal) * 100;
};

export const calculateRatio = (baseVal, compareVal) => {
  if (baseVal == null || compareVal == null) return null;
  if (baseVal === 0 && compareVal === 0) return 1;
  if (baseVal === 0) return 2;
  return compareVal / baseVal;
};

export const calculateOutlierBounds = (q1, q3) => {
  const iqr = q3 - q1;
  return {
    lower: q1 - OUTLIER_MULTIPLIER * iqr,
    upper: q3 + OUTLIER_MULTIPLIER * iqr
  };
};

export const calculateConfidenceInterval = (mean, variance, n) => {
  const ciDelta = Z_SCORE_95_PERCENT * (Math.sqrt(variance) / Math.sqrt(n));
  return {
    lower: mean - ciDelta,
    upper: mean + ciDelta
  };
};
