import { describe, it, expect } from 'vitest';
import {
  formatIndustrialNumber,
  formatPercentage,
  formatNumber,
  formatPValue,
  formatConfidenceInterval
} from './formatters.js';

describe('formatIndustrialNumber', () => {
  it('should return value as-is for null', () => {
    expect(formatIndustrialNumber(null)).toBeNull();
  });

  it('should return value as-is for undefined', () => {
    expect(formatIndustrialNumber(undefined)).toBeUndefined();
  });

  it('should return value as-is for empty string', () => {
    expect(formatIndustrialNumber('')).toBe('');
  });

  it('should return value as-is for non-numeric strings', () => {
    expect(formatIndustrialNumber('abc')).toBe('abc');
  });

  it('should format millions correctly', () => {
    expect(formatIndustrialNumber(1500000)).toBe('1.50M');
  });

  it('should format thousands correctly', () => {
    expect(formatIndustrialNumber(1500)).toBe('1.5K');
  });

  it('should return string for small numbers', () => {
    expect(formatIndustrialNumber(500)).toBe('500');
  });

  it('should handle negative millions', () => {
    expect(formatIndustrialNumber(-2500000)).toBe('-2.50M');
  });

  it('should handle negative thousands', () => {
    expect(formatIndustrialNumber(-1500)).toBe('-1.5K');
  });
});

describe('formatPercentage', () => {
  it('should return dash for null', () => {
    expect(formatPercentage(null)).toBe('-');
  });

  it('should return dash for NaN', () => {
    expect(formatPercentage(NaN)).toBe('-');
  });

  it('should format positive value with plus sign', () => {
    expect(formatPercentage(10.5)).toBe('+10.50%');
  });

  it('should format negative value without plus sign', () => {
    expect(formatPercentage(-10.5)).toBe('-10.50%');
  });

  it('should format zero correctly', () => {
    expect(formatPercentage(0)).toBe('0.00%');
  });

  it('should use custom decimals', () => {
    expect(formatPercentage(10.567, 1)).toBe('+10.6%');
  });
});

describe('formatNumber', () => {
  it('should return dash for null', () => {
    expect(formatNumber(null)).toBe('-');
  });

  it('should return dash for NaN', () => {
    expect(formatNumber(NaN)).toBe('-');
  });

  it('should format number with default decimals', () => {
    expect(formatNumber(10.567)).toBe('10.57');
  });

  it('should use custom decimals', () => {
    expect(formatNumber(10.567, 3)).toBe('10.567');
  });
});

describe('formatPValue', () => {
  it('should return dash for null', () => {
    expect(formatPValue(null)).toBe('-');
  });

  it('should return dash for NaN', () => {
    expect(formatPValue(NaN)).toBe('-');
  });

  it('should format p-value with 3 decimals', () => {
    expect(formatPValue(0.04567)).toBe('0.046');
  });
});

describe('formatConfidenceInterval', () => {
  it('should return dash for null lower', () => {
    expect(formatConfidenceInterval(null, 10)).toBe('-');
  });

  it('should return dash for null upper', () => {
    expect(formatConfidenceInterval(10, null)).toBe('-');
  });

  it('should format CI correctly', () => {
    expect(formatConfidenceInterval(-5.5, 10.5)).toBe('[-5.50%, 10.50%]');
  });

  it('should handle zero values', () => {
    expect(formatConfidenceInterval(0, 0)).toBe('[0.00%, 0.00%]');
  });
});
