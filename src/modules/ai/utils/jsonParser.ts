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

/**
 * Extract an array from an AI JSON response.
 *
 * OpenAI's `response_format: { type: "json_object" }` always returns an
 * object — never a raw array. The model wraps the array in an arbitrary key
 * (e.g. "questions", "results", "mcqs", "validations", "validation_results").
 *
 * This helper parses the response and:
 *  1. If the result is already an array, returns it.
 *  2. If it's an object, finds the first top-level value that is an array.
 *  3. Throws if no array is found.
 */
export function extractArrayFromAI<T>(raw: string): T[] {
  const parsed = parseJsonFromAI<unknown>(raw);

  // Direct array (unlikely with json_object mode, but handle it)
  if (Array.isArray(parsed)) {
    return parsed as T[];
  }

  // Object — scan values for the first array
  if (parsed && typeof parsed === "object") {
    const entries = Object.values(parsed as Record<string, unknown>);

    // Case 1: One of the values is an array → use it
    for (const value of entries) {
      if (Array.isArray(value)) {
        console.log(
          `[JsonParser] Extracted array (length=${value.length}) from wrapper object`
        );
        return value as T[];
      }
    }

    // Case 2: All values are objects (AI returned { "q1": {...}, "q2": {...} })
    // Collect them into an array
    const objectValues = entries.filter(
      (v) => v && typeof v === "object" && !Array.isArray(v)
    );
    if (objectValues.length > 0 && objectValues.length === entries.length) {
      console.log(
        `[JsonParser] Collected ${objectValues.length} object values into array (keyed-object format)`
      );
      return objectValues as T[];
    }

    // Case 3: Mixed or unexpected — log the structure for debugging
    console.error(
      `[JsonParser] Could not extract array. Object keys: [${Object.keys(parsed as Record<string, unknown>).join(", ")}]`
    );
    console.error(
      `[JsonParser] Value types: [${entries.map((v) => (Array.isArray(v) ? "array" : typeof v)).join(", ")}]`
    );
  }

  throw new Error(
    "AI response does not contain an array at the top level or inside a wrapper object"
  );
}
