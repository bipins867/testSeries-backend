import { Router } from "express";
import {
  handleGenerateQuiz,
  handleSubmitQuiz,
} from "../controllers/quizController";

const router = Router();

/**
 * POST /generate-quiz
 * Generate a validated UPSC MCQ quiz on a given topic.
 */
router.post("/generate-quiz", handleGenerateQuiz);

/**
 * POST /submit-quiz
 * Submit answers for a generated quiz and receive scored analysis.
 */
router.post("/submit-quiz", handleSubmitQuiz);

export default router;
