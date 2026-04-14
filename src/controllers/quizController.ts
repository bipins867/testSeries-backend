import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { createQuiz, submitQuiz, QuizNotFoundError } from "../services/quizService";

// ──────────────────────────────────────────────
// Request validation schemas (Zod)
// ──────────────────────────────────────────────

const generateQuizSchema = z.object({
  topic: z
    .string()
    .min(2, "Topic must be at least 2 characters")
    .max(200, "Topic must be at most 200 characters"),
  numberOfQuestions: z
    .number()
    .int("numberOfQuestions must be an integer")
    .min(1, "Must request at least 1 question")
    .max(20, "Maximum 20 questions per request"),
});

const submitQuizSchema = z.object({
  quizId: z.string().uuid("quizId must be a valid UUID"),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selected: z.string().min(1),
      })
    )
    .min(1, "Must submit at least 1 answer"),
});

// ──────────────────────────────────────────────
// POST /generate-quiz
// ──────────────────────────────────────────────

export async function handleGenerateQuiz(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = generateQuizSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation error",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { topic, numberOfQuestions } = parsed.data;

    console.log(
      `[Controller] POST /generate-quiz — topic: "${topic}", count: ${numberOfQuestions}`
    );

    const quiz = await createQuiz(topic, numberOfQuestions);

    res.status(200).json(quiz);
  } catch (err) {
    next(err);
  }
}

// ──────────────────────────────────────────────
// POST /submit-quiz
// ──────────────────────────────────────────────

export async function handleSubmitQuiz(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = submitQuizSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation error",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { quizId, answers } = parsed.data;

    console.log(
      `[Controller] POST /submit-quiz — quizId: ${quizId}, answers: ${answers.length}`
    );

    const result = await submitQuiz(quizId, answers);

    res.status(200).json(result);
  } catch (err) {
    if (err instanceof QuizNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    next(err);
  }
}
