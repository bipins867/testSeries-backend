import OpenAI from "openai";
import { config } from "../config";
import { withRetry } from "../utils/retry";
import { parseJsonFromAI } from "../utils/jsonParser";
import type {
  GeneratedQuestion,
  ValidationResult,
  QuizAnalysis,
  StoredQuestion,
  SubmittedAnswer,
} from "../types/quiz";

// ──────────────────────────────────────────────
// OpenAI client singleton
// ──────────────────────────────────────────────
const openai = new OpenAI({ apiKey: config.openai.apiKey });

// ──────────────────────────────────────────────
// Step 1 — Generate Questions
// ──────────────────────────────────────────────

/**
 * Ask GPT to generate `count` UPSC-level MCQs on the given topic.
 */
export async function generateQuestions(
  topic: string,
  count: number
): Promise<GeneratedQuestion[]> {
  const systemPrompt = `You are an expert UPSC Civil Services Examination question setter with deep knowledge of Indian history, polity, geography, economy, science, and current affairs.`;

  const userPrompt = `Generate exactly ${count} UPSC Prelims level MCQs on the topic: "${topic}".

Rules:
- Questions must be based STRICTLY on the given topic
- Each question must have exactly 4 options labeled A, B, C, D
- Only 1 correct answer per question
- Include a concise explanation for the correct answer
- Avoid ambiguous, controversial, or opinion-based facts
- Ensure factual accuracy — use only well-established, widely-accepted knowledge
- Assign a confidence score (0 to 1) indicating how certain you are about the factual accuracy

Return ONLY a valid JSON array (no extra text) in this exact format:
[
  {
    "question": "The question text here",
    "options": ["A) Option A text", "B) Option B text", "C) Option C text", "D) Option D text"],
    "correctAnswer": "A",
    "explanation": "Brief explanation of the correct answer",
    "confidence": 0.95
  }
]`;

  return withRetry(async () => {
    console.log(
      `[OpenAI] Generating ${count} questions on topic: "${topic}" ...`
    );

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      temperature: config.openai.generationTemperature,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from OpenAI during question generation");
    }

    const parsed = parseJsonFromAI<
      GeneratedQuestion[] | { questions: GeneratedQuestion[] }
    >(content);

    // Handle both { questions: [...] } and direct array formats
    const questions = Array.isArray(parsed) ? parsed : parsed.questions;

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("AI returned an invalid or empty questions array");
    }

    console.log(`[OpenAI] Generated ${questions.length} questions`);
    return questions;
  }, config.quiz.maxRetries);
}

// ──────────────────────────────────────────────
// Step 2 — Validate Questions (Anti-Hallucination)
// ──────────────────────────────────────────────

/**
 * Send generated questions through a second AI pass to detect
 * factual errors, ambiguity, and hallucinations.
 */
export async function validateQuestions(
  questions: GeneratedQuestion[]
): Promise<ValidationResult[]> {
  const systemPrompt = `You are a senior UPSC examiner and fact-checker. Your job is to rigorously validate Multiple Choice Questions for factual accuracy, answer correctness, and clarity. Be strict — if there is ANY doubt about a fact, mark the question as invalid.`;

  const userPrompt = `Validate the following ${questions.length} MCQs intended for a UPSC Prelims examination:

${JSON.stringify(questions, null, 2)}

For EACH question, check:
1. Is the stated correct answer actually correct?
2. Is the question free from ambiguity — is there exactly one defensible answer?
3. Are all stated facts accurate and not hallucinated?
4. Are the distractor options plausible but clearly incorrect?

Return ONLY a valid JSON array (no extra text) with one entry per question in order:
[
  {
    "isValid": true,
    "correctedAnswer": "A",
    "issues": ""
  }
]

If a question is invalid, set isValid to false, provide the correctedAnswer if possible, and describe the issues.`;

  return withRetry(async () => {
    console.log(`[OpenAI] Validating ${questions.length} questions ...`);

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      temperature: config.openai.validationTemperature,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from OpenAI during validation");
    }

    const parsed = parseJsonFromAI<
      ValidationResult[] | { validations: ValidationResult[] }
    >(content);

    const results = Array.isArray(parsed) ? parsed : parsed.validations;

    if (!Array.isArray(results)) {
      throw new Error("Validation response is not an array");
    }

    console.log(
      `[OpenAI] Validation complete — ${results.filter((r) => r.isValid).length}/${results.length} valid`
    );
    return results;
  }, config.quiz.maxRetries);
}

// ──────────────────────────────────────────────
// Step 4 — Performance Analysis
// ──────────────────────────────────────────────

/**
 * Analyse the user's quiz performance via AI and return structured feedback.
 */
export async function analyzePerformance(
  topic: string,
  questions: StoredQuestion[],
  answers: SubmittedAnswer[],
  score: number,
  total: number
): Promise<QuizAnalysis> {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.selected]));

  const breakdown = questions.map((q) => ({
    question: q.question,
    correctAnswer: q.correctAnswer,
    userAnswer: answerMap.get(q.id) ?? "NOT_ANSWERED",
    isCorrect: answerMap.get(q.id) === q.correctAnswer,
    explanation: q.explanation,
  }));

  const systemPrompt = `You are an expert UPSC mentor. Analyze the aspirant's quiz performance and give actionable, specific feedback to help them improve.`;

  const userPrompt = `A UPSC aspirant attempted a quiz on: "${topic}"
Score: ${score}/${total}

Detailed breakdown:
${JSON.stringify(breakdown, null, 2)}

Provide a thorough analysis. Return ONLY valid JSON (no extra text):
{
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "summary": "A brief overall performance summary paragraph",
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2"]
}`;

  return withRetry(async () => {
    console.log(`[OpenAI] Analyzing performance for topic: "${topic}" ...`);

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      temperature: 0.5,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from OpenAI during analysis");
    }

    const analysis = parseJsonFromAI<QuizAnalysis>(content);

    // Sanitize — ensure arrays
    return {
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
      weaknesses: Array.isArray(analysis.weaknesses)
        ? analysis.weaknesses
        : [],
      summary:
        typeof analysis.summary === "string"
          ? analysis.summary
          : "Analysis not available.",
      suggestions: Array.isArray(analysis.suggestions)
        ? analysis.suggestions
        : [],
    };
  }, config.quiz.maxRetries);
}
