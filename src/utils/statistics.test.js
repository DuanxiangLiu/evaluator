import { describe, it, expect } from 'vitest';
import {
  calculateImprovement,
  calculateRatio,
  quantile,
  calculateWilcoxonPValue,
  calculatePearsonCorrelation,
  calculateSpearmanCorrelation,
  calculateOutlierBounds,
  calculateConfidenceInterval,
  normalCDF,
  interpretCorrelation
} from './statistics.js';

describe('calculateImprovement', () => {
  it('should return null when baseVal is null', () => {
    expect(calculateImprovement(null, 100)).toBeNull();
  });

  it('should return null when compareVal is null', () => {
    expect(calculateImprovement(100, null)).toBeNull();
  });

  it('should return 0 when both values are 0', () => {
    expect(calculateImprovement(0, 0)).toBe(0);
  });

  it('should return -100 when base is 0 and compare is positive', () => {
    expect(calculateImprovement(0, 100)).toBe(-100);
  });

  it('should return 100 when base is 0 and compare is negative', () => {
    expect(calculateImprovement(0, -100)).toBe(100);
  });

  it('should calculate positive improvement correctly', () => {
    expect(calculateImprovement(100, 80)).toBe(20);
  });

  it('should calculate negative improvement correctly', () => {
    expect(calculateImprovement(100, 120)).toBe(-20);
  });

  it('should handle decimal values', () => {
    expect(calculateImprovement(100.5, 90.45)).toBeCloseTo(10.0, 1);
  });
});

describe('calculateRatio', () => {
  it('should return null when baseVal is null', () => {
    expect(calculateRatio(null, 100)).toBeNull();
  });

  it('should return 1 when both values are 0', () => {
    expect(calculateRatio(0, 0)).toBe(1);
  });

  it('should return 2 when base is 0', () => {
    expect(calculateRatio(0, 100)).toBe(2);
  });

  it('should calculate ratio correctly', () => {
    expect(calculateRatio(100, 50)).toBe(0.5);
  });

  it('should handle decimal values', () => {
    expect(calculateRatio(100, 75)).toBe(0.75);
  });
});

describe('quantile', () => {
  it('should return 0 for empty array', () => {
    expect(quantile([], 0.5)).toBe(0);
  });

  it('should calculate median correctly', () => {
    expect(quantile([1, 2, 3, 4, 5], 0.5)).toBe(3);
  });

  it('should calculate Q1 correctly', () => {
    expect(quantile([1, 2, 3, 4, 5], 0.25)).toBe(2);
  });

  it('should calculate Q3 correctly', () => {
    expect(quantile([1, 2, 3, 4, 5], 0.75)).toBe(4);
  });

  it('should handle unsorted arrays', () => {
    expect(quantile([5, 1, 3, 2, 4], 0.5)).toBe(3);
  });
});

describe('calculatePearsonCorrelation', () => {
  it('should return null for arrays of different lengths', () => {
    expect(calculatePearsonCorrelation([1, 2], [1, 2, 3])).toBeNull();
  });

  it('should return null for arrays with less than 2 elements', () => {
    expect(calculatePearsonCorrelation([1], [1])).toBeNull();
  });

  it('should return 1 for perfectly correlated data', () => {
    expect(calculatePearsonCorrelation([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 5);
  });

  it('should return -1 for perfectly negatively correlated data', () => {
    expect(calculatePearsonCorrelation([1, 2, 3], [3, 2, 1])).toBeCloseTo(-1, 5);
  });

  it('should return 0 for uncorrelated data', () => {
    expect(calculatePearsonCorrelation([1, 2, 3], [1, 1, 1])).toBe(0);
  });
});

describe('calculateSpearmanCorrelation', () => {
  it('should return null for arrays of different lengths', () => {
    expect(calculateSpearmanCorrelation([1, 2], [1, 2, 3])).toBeNull();
  });

  it('should return 1 for perfectly correlated ranks', () => {
    expect(calculateSpearmanCorrelation([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 5);
  });

  it('should handle ties correctly', () => {
    const result = calculateSpearmanCorrelation([1, 1, 2], [1, 1, 2]);
    expect(result).toBeCloseTo(1, 5);
  });
});

describe('calculateOutlierBounds', () => {
  it('should calculate bounds correctly', () => {
    const result = calculateOutlierBounds(25, 75);
    expect(result.lower).toBe(-50);
    expect(result.upper).toBe(150);
  });

  it('should handle zero IQR', () => {
    const result = calculateOutlierBounds(50, 50);
    expect(result.lower).toBe(50);
    expect(result.upper).toBe(50);
  });
});

describe('calculateConfidenceInterval', () => {
  it('should return mean when n is 0', () => {
    const result = calculateConfidenceInterval(10, 4, 0);
    expect(result.lower).toBe(10);
    expect(result.upper).toBe(10);
  });

  it('should calculate CI correctly for large sample', () => {
    const result = calculateConfidenceInterval(100, 100, 100);
    expect(result.lower).toBeLessThan(100);
    expect(result.upper).toBeGreaterThan(100);
  });

  it('should use t-distribution for small sample', () => {
    const result = calculateConfidenceInterval(100, 100, 10);
    expect(result.lower).toBeLessThan(100);
    expect(result.upper).toBeGreaterThan(100);
  });
});

describe('normalCDF', () => {
  it('should return 0.5 for x=0', () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 4);
  });

  it('should return close to 1 for large positive x', () => {
    expect(normalCDF(3)).toBeCloseTo(0.9987, 3);
  });

  it('should return close to 0 for large negative x', () => {
    expect(normalCDF(-3)).toBeCloseTo(0.0013, 3);
  });

  it('should be symmetric', () => {
    expect(normalCDF(1) + normalCDF(-1)).toBeCloseTo(1, 4);
  });
});

describe('interpretCorrelation', () => {
  it('should interpret strong positive correlation', () => {
    const result = interpretCorrelation(0.9);
    expect(result.strength).toBe('极强');
    expect(result.direction).toBe('正相关');
  });

  it('should interpret strong negative correlation', () => {
    const result = interpretCorrelation(-0.9);
    expect(result.strength).toBe('极强');
    expect(result.direction).toBe('负相关');
  });

  it('should interpret weak correlation', () => {
    const result = interpretCorrelation(0.2);
    expect(result.strength).toBe('极弱或无');
  });

  it('should interpret moderate correlation', () => {
    const result = interpretCorrelation(0.5);
    expect(result.strength).toBe('中等');
  });
});

describe('calculateWilcoxonPValue', () => {
  it('should return 1 for empty differences', () => {
    expect(calculateWilcoxonPValue([])).toBe(1.0);
  });

  it('should return 1 for all zero differences', () => {
    expect(calculateWilcoxonPValue([0, 0, 0])).toBe(1.0);
  });

  it('should calculate p-value for non-zero differences', () => {
    const result = calculateWilcoxonPValue([1, 2, 3, 4, 5]);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});
