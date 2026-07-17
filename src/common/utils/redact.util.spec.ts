import { redactName } from './redact.util';

describe('redactName', () => {
  it('should return empty string for null, undefined, or empty name', () => {
    expect(redactName(null)).toBe('');
    expect(redactName(undefined)).toBe('');
    expect(redactName('')).toBe('');
  });

  it('should redact single word name', () => {
    expect(redactName('Jane')).toBe('J***');
  });

  it('should redact multi-word name', () => {
    expect(redactName('John Doe')).toBe('J*** D**');
    expect(redactName('Alice Smith Johnson')).toBe('A**** S**** J******');
  });

  it('should preserve single characters', () => {
    expect(redactName('J D')).toBe('J D');
    expect(redactName('John A Doe')).toBe('J*** A D**');
  });
});
