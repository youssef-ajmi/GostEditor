import { describe, it, expect } from 'vitest';

describe('test infrastructure', () => {
  it('vitest runs with jsdom', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });

  it('basic assertions work', () => {
    expect(1 + 1).toBe(2);
    expect({ a: 1 }).toEqual({ a: 1 });
  });
});
