import { describe, it, expect } from 'vitest';
import { generateId } from './utils';

describe('generateId', () => {
  it('should generate a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  it('should generate non-empty strings', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });

  it('should generate unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(1000);
  });

  it('should generate IDs with expected length range', () => {
    const id = generateId();
    // Each random string is 13 chars, so total should be around 26
    expect(id.length).toBeGreaterThanOrEqual(20);
    expect(id.length).toBeLessThanOrEqual(30);
  });

  it('should only contain alphanumeric characters', () => {
    const id = generateId();
    expect(id).toMatch(/^[a-z0-9]+$/);
  });
});
