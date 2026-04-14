/**
 * Safely extract and parse a JSON block from an AI response string.
 *
 * The AI may wrap the JSON in markdown fences (```json ... ```) or
 * return it with leading/trailing prose. This function handles all of that.
 */
export function parseJsonFromAI<T>(raw: string): T {
  // Strip markdown code fences if present
  let cleaned = raw.trim();

  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Try to find the outermost JSON structure (array or object)
  const jsonStart = cleaned.search(/[\[{]/);
  const jsonEndBracket = cleaned.lastIndexOf("]");
  const jsonEndBrace = cleaned.lastIndexOf("}");
  const jsonEnd = Math.max(jsonEndBracket, jsonEndBrace);

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No JSON structure found in AI response");
  }

  const jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    throw new Error(
      `Failed to parse JSON from AI response: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
