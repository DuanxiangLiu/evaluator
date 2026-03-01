import { NORMAL_CDF_COEFFICIENTS, Z_SCORE_95_PERCENT, OUTLIER_MULTIPLIER } from './constants';

const T_DISTRIBUTION_TABLE = {
  1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
  6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
  11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
  16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
  21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060,
  26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042,
  40: 2.021, 50: 2.009, 60: 2.000, 80: 1.990, 100: 1.984,
  120: 1.980, Infinity: 1.96
};

const getTCriticalValue = (df) => {
  if (df <= 0) return Z_SCORE_95_PERCENT;
  if (T_DISTRIBUTION_TABLE[df]) return T_DISTRIBUTION_TABLE[df];
  const keys = Object.keys(T_DISTRIBUTION_TABLE).map(Number).filter(k => k > 0).sort((a, b) => a - b);
  for (const k of keys) {
    if (df <= k) return T_DISTRIBUTION_TABLE[k];
  }
  return T_DISTRIBUTION_TABLE[Infinity];
};

export const normalCDF = (x) => {
  const { T_COEFFICIENT, D_COEFFICIENT, P_COEFFICIENTS } = NORMAL_CDF_COEFFICIENTS;
  const t = 1 / (1 + T_COEFFICIENT * Math.abs(x));
  const d = D_COEFFICIENT * Math.exp(-x * x / 2);
  const p = d * t * (P_COEFFICIENTS[0] + t * (P_COEFFICIENTS[1] + t * (P_COEFFICIENTS[2] + t * (P_COEFFICIENTS[3] + t * P_COEFFICIENTS[4]))));
  return x > 0 ? 1 - p : p;
};

export const calculatePearsonCorrelation = (x, y) => {
  const n = x.length;
  if (n !== y.length || n < 2) return null;
  
  const validPairs = [];
  for (let i = 0; i < n; i++) {
    if (x[i] != null && y[i] != null && !isNaN(x[i]) && !isNaN(y[i])) {
      validPairs.push([x[i], y[i]]);
    }
  }
  
  if (validPairs.length < 2) return null;
  
  const validX = validPairs.map(p => p[0]);
  const validY = validPairs.map(p => p[1]);
  const m = validPairs.length;
  
  const sumX = validX.reduce((a, b) => a + b, 0);
  const sumY = validY.reduce((a, b) => a + b, 0);
  const sumXY = validX.reduce((acc, xi, i) => acc + xi * validY[i], 0);
  const sumX2 = validX.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = validY.reduce((acc, yi) => acc + yi * yi, 0);
  
  const numerator = m * sumXY - sumX * sumY;
  const denominator = Math.sqrt((m * sumX2 - sumX * sumX) * (m * sumY2 - sumY * sumY));
  
  if (denominator === 0) return 0;
  
  const r = numerator / denominator;
  return Math.max(-1, Math.min(1, r));
};

export const calculateSpearmanCorrelation = (x, y) => {
  const n = x.length;
  if (n !== y.length || n < 2) return null;
  
  const validPairs = [];
  for (let i = 0; i < n; i++) {
    if (x[i] != null && y[i] != null && !isNaN(x[i]) && !isNaN(y[i])) {
      validPairs.push([x[i], y[i]]);
    }
  }
  
  if (validPairs.length < 2) return null;
  
  const assignRanks = (arr) => {
    const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array(arr.length);
    let i = 0;
    while (i < sorted.length) {
      let j = i;
      while (j < sorted.length - 1 && sorted[j].v === sorted[j + 1].v) {
        j++;
      }
      const avgRank = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) {
        ranks[sorted[k].i] = avgRank;
      }
      i = j + 1;
    }
    return ranks;
  };
  
  const validX = validPairs.map(p => p[0]);
  const validY = validPairs.map(p => p[1]);
  
  const ranksX = assignRanks(validX);
  const ranksY = assignRanks(validY);
  
  return calculatePearsonCorrelation(ranksX, ranksY);
};

export const calculateLinearRegression = (x, y) => {
  const n = x.length;
  if (n !== y.length || n < 2) return null;
  
  const validPairs = [];
  for (let i = 0; i < n; i++) {
    if (x[i] != null && y[i] != null && !isNaN(x[i]) && !isNaN(y[i])) {
      validPairs.push([x[i], y[i]]);
    }
  }
  
  if (validPairs.length < 2) return null;
  
  const validX = validPairs.map(p => p[0]);
  const validY = validPairs.map(p => p[1]);
  const m = validPairs.length;
  
  const sumX = validX.reduce((a, b) => a + b, 0);
  const sumY = validY.reduce((a, b) => a + b, 0);
  const sumXY = validX.reduce((acc, xi, i) => acc + xi * validY[i], 0);
  const sumX2 = validX.reduce((acc, xi) => acc + xi * xi, 0);
  
  const denominator = m * sumX2 - sumX * sumX;
  if (denominator === 0) return null;
  
  const slope = (m * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / m;
  
  const meanY = sumY / m;
  let ssTotal = 0, ssResidual = 0;
  for (let i = 0; i < m; i++) {
    const predicted = slope * validX[i] + intercept;
    ssTotal += Math.pow(validY[i] - meanY, 2);
    ssResidual += Math.pow(validY[i] - predicted, 2);
  }
  
  const rSquared = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;
  
  return { slope, intercept, rSquared };
};

export const detectOutliers = (values, threshold = 1.5) => {
  if (!values || values.length < 4) return [];
  
  const sorted = [...values].filter(v => v != null && !isNaN(v)).sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  
  const lowerBound = q1 - threshold * iqr;
  const upperBound = q3 + threshold * iqr;
  
  return values.map((v, i) => {
    if (v == null || isNaN(v)) return null;
    if (v < lowerBound || v > upperBound) {
      return { index: i, value: v, type: v < lowerBound ? 'low' : 'high' };
    }
    return null;
  }).filter(Boolean);
};

export const interpretCorrelation = (r) => {
  const absR = Math.abs(r);
  let strength, direction;
  
  if (absR >= 0.9) strength = '极强';
  else if (absR >= 0.7) strength = '强';
  else if (absR >= 0.5) strength = '中等';
  else if (absR >= 0.3) strength = '弱';
  else strength = '极弱或无';
  
  direction = r > 0 ? '正相关' : r < 0 ? '负相关' : '无相关';
  
  return { strength, direction, absR };
};

export const calculateWilcoxonPValue = (diffs) => {
  const nonZeroDiffs = diffs.filter(d => d !== 0);
  const n = nonZeroDiffs.length;
  if (n === 0) return 1.0;
  
  const absDiffs = nonZeroDiffs.map((d, idx) => ({ val: d, abs: Math.abs(d), originalIndex: idx }));
  absDiffs.sort((a, b) => a.abs - b.abs);
  
  const ranks = new Array(absDiffs.length);
  let i = 0;
  while (i < absDiffs.length) {
    let j = i;
    while (j < absDiffs.length - 1 && absDiffs[j].abs === absDiffs[j + 1].abs) {
      j++;
    }
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) {
      ranks[k] = avgRank;
    }
    i = j + 1;
  }
  
  let wPlus = 0, wMinus = 0;
  for (let idx = 0; idx < absDiffs.length; idx++) {
    if (absDiffs[idx].val > 0) {
      wPlus += ranks[idx];
    } else {
      wMinus += ranks[idx];
    }
  }
  
  const w = Math.min(wPlus, wMinus);
  const expectedW = (n * (n + 1)) / 4;
  
  let tieCorrection = 0;
  let tieStart = 0;
  while (tieStart < absDiffs.length) {
    let tieEnd = tieStart;
    while (tieEnd < absDiffs.length - 1 && absDiffs[tieEnd].abs === absDiffs[tieEnd + 1].abs) {
      tieEnd++;
    }
    const tieSize = tieEnd - tieStart + 1;
    if (tieSize > 1) {
      tieCorrection += tieSize * (tieSize * tieSize - 1);
    }
    tieStart = tieEnd + 1;
  }
  
  const varianceW = (n * (n + 1) * (2 * n + 1) - tieCorrection) / 24;
  
  if (varianceW <= 0) return 1.0;
  
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
  if (baseVal === 0) {
    return compareVal > 0 ? -100 : 100;
  }
  return ((baseVal - compareVal) / baseVal) * 100;
};

export const calculateImprovementWithDirection = (baseVal, compareVal, isHigherBetter = false) => {
  if (baseVal == null || compareVal == null) return null;
  
  if (isHigherBetter) {
    if (baseVal === 0 && compareVal === 0) return 0;
    if (baseVal === 0) {
      return compareVal > 0 ? 100 : -100;
    }
    return ((compareVal - baseVal) / Math.abs(baseVal)) * 100;
  } else {
    return calculateImprovement(baseVal, compareVal);
  }
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
  if (n <= 0 || variance < 0) {
    return { lower: mean, upper: mean };
  }
  const criticalValue = n >= 30 ? Z_SCORE_95_PERCENT : getTCriticalValue(n - 1);
  const ciDelta = criticalValue * (Math.sqrt(variance) / Math.sqrt(n));
  return {
    lower: mean - ciDelta,
    upper: mean + ciDelta
  };
};
