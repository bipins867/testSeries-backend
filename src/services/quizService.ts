import { config } from "../config";
import { generateId, generateQuestionId } from "../utils/uuid";
import { quizStore } from "./storeService";
import {
  generateQuestions,
  validateQuestions,
  analyzePerformance,
} from "./openaiService";
import type {
  GenerateQuizResponse,
  SubmitQuizResponse,
  SubmittedAnswer,
  StoredQuestion,
  GeneratedQuestion,
  ValidationResult,
} from "../types/quiz";

// ──────────────────────────────────────────────
// Generate Quiz — orchestrates generation + validation + filtering
// ──────────────────────────────────────────────

export async function createQuiz(
  topic: string,
  numberOfQuestions: number,
  difficulty: "Easy" | "Medium" | "Hard" | "Mixed" = "Mixed"
): Promise<GenerateQuizResponse> {
  // Request extra questions to account for validation filtering
  const requestCount = Math.min(
    Math.ceil(numberOfQuestions * 1.5),
    config.quiz.maxQuestionsPerRequest
  );

  let validQuestions: StoredQuestion[] = [];
  let attempts = 0;
  const maxAttempts = config.quiz.maxRetries;

  while (validQuestions.length < numberOfQuestions && attempts < maxAttempts) {
    attempts++;
    console.log(
      `[QuizService] Attempt ${attempts} — need ${numberOfQuestions - validQuestions.length} more question(s)`
    );

    const remaining = numberOfQuestions - validQuestions.length;
    const toRequest = Math.min(
      Math.ceil(remaining * 1.5),
      requestCount
    );

    // Step 1: Generate
    const rawQuestions = await generateQuestions(topic, toRequest, difficulty);

    // Step 2: Validate (anti-hallucination)
    const validations = await validateQuestions(rawQuestions);

    // Step 3: Filter — only keep valid + high-confidence questions
    const filtered = filterQuestions(rawQuestions, validations);
    console.log(
      `[QuizService] Filtered ${filtered.length} valid question(s) from ${rawQuestions.length}`
    );

    // Map to stored format
    const mapped: StoredQuestion[] = filtered.map((q, i) => ({
      id: generateQuestionId(validQuestions.length + i),
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty || "Medium",
    }));

    validQuestions = [...validQuestions, ...mapped];
  }

  // Trim to exact count requested
  validQuestions = validQuestions.slice(0, numberOfQuestions);

  if (validQuestions.length === 0) {
    throw new Error(
      "Unable to generate any valid questions after multiple attempts. Try a different topic."
    );
  }

  // Re-index IDs so they are sequential
  validQuestions = validQuestions.map((q, i) => ({
    ...q,
    id: generateQuestionId(i),
  }));

  // Persist in memory
  const quizId = generateId();
  quizStore.set(quizId, {
    quizId,
    topic,
    questions: validQuestions,
    createdAt: new Date(),
  });

  // Build response (strip answers)
  const response: GenerateQuizResponse = {
    quizId,
    questions: validQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty,
    })),
  };

  console.log(
    `[QuizService] Quiz ${quizId} created with ${validQuestions.length} question(s)`
  );
  return response;
}

// ──────────────────────────────────────────────
// Submit Quiz — score + analysis
// ──────────────────────────────────────────────

export async function submitQuiz(
  quizId: string,
  answers: SubmittedAnswer[]
): Promise<SubmitQuizResponse> {
  const quiz = quizStore.get(quizId);
  if (!quiz) {
    throw new QuizNotFoundError(quizId);
  }

  // Build answer lookup
  const answerMap = new Map(answers.map((a) => [a.questionId, a.selected]));

  // Calculate score
  let score = 0;
  for (const question of quiz.questions) {
    const userAnswer = answerMap.get(question.id);
    if (userAnswer === question.correctAnswer) {
      score++;
    }
  }

  const total = quiz.questions.length;

  // AI analysis
  const analysis = await analyzePerformance(
    quiz.topic,
    quiz.questions,
    answers,
    score,
    total
  );

  // Build detailed results
  const feedbackMap = new Map(
    analysis.questionFeedback?.map((f) => [f.questionId, f.feedback]) || []
  );

  const detailedResults = quiz.questions.map((q) => {
    const userAnswer = answerMap.get(q.id) || "NOT_ANSWERED";
    const isCorrect = userAnswer === q.correctAnswer;
    const aiFeedback =
      feedbackMap.get(q.id) ||
      (isCorrect ? "Good job!" : "Review the explanation carefully.");

    return {
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer,
      explanation: q.explanation,
      isCorrect,
      aiFeedback,
    };
  });

  console.log(
    `[QuizService] Quiz ${quizId} submitted — Score: ${score}/${total}`
  );

  return { score, total, analysis, detailedResults };
}

// ──────────────────────────────────────────────
// Filtering logic
// ──────────────────────────────────────────────

function filterQuestions(
  questions: GeneratedQuestion[],
  validations: ValidationResult[]
): GeneratedQuestion[] {
  return questions.filter((q, index) => {
    const validation = validations[index];
    if (!validation) return false;

    // Must be validated as correct
    if (!validation.isValid) {
      console.log(
        `[Filter] Rejected: "${q.question.substring(0, 50)}..." — ${validation.issues || "marked invalid"}`
      );
      return false;
    }

    // Confidence threshold
    if (q.confidence < config.quiz.minConfidence) {
      console.log(
        `[Filter] Rejected: "${q.question.substring(0, 50)}..." — low confidence (${q.confidence})`
      );
      return false;
    }

    // Apply corrected answer if the validator suggests one
    if (validation.correctedAnswer && validation.correctedAnswer !== q.correctAnswer) {
      console.log(
        `[Filter] Answer corrected for: "${q.question.substring(0, 50)}..." — ${q.correctAnswer} → ${validation.correctedAnswer}`
      );
      q.correctAnswer = validation.correctedAnswer;
    }

    return true;
  });
}

// ──────────────────────────────────────────────
// Custom errors
// ──────────────────────────────────────────────

export class QuizNotFoundError extends Error {
  constructor(quizId: string) {
    super(`Quiz not found or expired: ${quizId}`);
    this.name = "QuizNotFoundError";
  }
}
