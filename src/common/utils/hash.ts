import crypto from 'crypto';

/**
 * Generate a SHA-256 fingerprint of question text for deduplication.
 * Normalizes the text before hashing: lowercase, strip punctuation, collapse whitespace.
 */
export function generateQuestionHash(questionText: string): string {
  const normalized = questionText
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' ')    // collapse whitespace
    .trim();

  return crypto.createHash('sha256').update(normalized).digest('hex');
}
