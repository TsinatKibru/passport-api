/**
 * Redact Name Utility
 * 
 * Redacts passport holder names for Staff users to comply with privacy rules.
 * Keeps the first character of each word, and replaces the rest with asterisks (*).
 * 
 * @param name - Original holder name
 * @returns Redacted/masked name
 * 
 * @example
 * redactName("John Doe") // "J*** D**"
 * redactName("Jane") // "J***"
 * redactName("") // ""
 */
export function redactName(name: string | null | undefined): string {
  if (!name) {
    return '';
  }

  return name
    .split(' ')
    .map((word) => {
      if (word.length <= 1) return word;
      return word[0] + '*'.repeat(word.length - 1);
    })
    .join(' ');
}
