import dotenv from "dotenv";
import path from "path";

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

interface AppConfig {
  port: number;
  nodeEnv: string;
  openai: {
    apiKey: string;
    model: string;
    /** Temperature for generation (slightly creative). */
    generationTemperature: number;
    /** Temperature for validation (deterministic). */
    validationTemperature: number;
  };
  quiz: {
    /** Minimum confidence threshold for a generated question. */
    minConfidence: number;
    /** Maximum retry attempts for AI calls. */
    maxRetries: number;
    /** Maximum number of questions per request. */
    maxQuestionsPerRequest: number;
    /** Quiz expiry in milliseconds (1 hour). */
    quizTtlMs: number;
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  openai: {
    apiKey: requireEnv("OPENAI_API_KEY"),
    model: process.env.OPENAI_MODEL || "gpt-4o",
    generationTemperature: 0.7,
    validationTemperature: 0.2,
  },
  quiz: {
    minConfidence: 0.7,
    maxRetries: 3,
    maxQuestionsPerRequest: 20,
    quizTtlMs: 60 * 60 * 1000, // 1 hour
  },
};
