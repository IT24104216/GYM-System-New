import {
  formatSuggestionSource,
  shiftIsoDate,
  toIsoDate,
} from './userMealPlan.utils.js';

describe('userMealPlan utils', () => {
  it('formats iso date and handles invalid dates', () => {
    expect(toIsoDate('2026-03-21T10:00:00Z')).toBe('2026-03-21');
    expect(toIsoDate('invalid')).toBe('');
  });

  it('shifts iso date by offset', () => {
    expect(shiftIsoDate('2026-03-21', 2)).toBe('2026-03-23');
    expect(shiftIsoDate('invalid', 2)).toBe('invalid');
  });

  it('formats suggestion sources into labels', () => {
    expect(formatSuggestionSource('usda')).toBe('USDA');
    expect(formatSuggestionSource('sri-lanka-db')).toBe('Local DB');
    expect(formatSuggestionSource('api_ninjas')).toBe('Api Ninjas');
    expect(formatSuggestionSource('')).toBe('Unknown');
  });
});
