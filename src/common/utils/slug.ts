/**
 * Generate a URL-safe slug from a string.
 * "Harappan Civilization" → "harappan-civilization"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove non-word chars except hyphens
    .replace(/[\s_]+/g, '-')    // replace spaces/underscores
    .replace(/-+/g, '-')        // collapse multiple hyphens
    .replace(/^-|-$/g, '');     // trim leading/trailing hyphens
}

/**
 * Normalize a topic name for DB matching.
 * "  Harappan   Civilization  " → "harappan civilization"
 */
export function normalizeTopic(topic: string): string {
  return topic
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}
