import { v4 as uuidv4 } from "uuid";

/** Generate a new UUID v4 string. */
export function generateId(): string {
  return uuidv4();
}

/** Generate a short question ID (e.g. "q1", "q2"). */
export function generateQuestionId(index: number): string {
  return `q${index + 1}`;
}
