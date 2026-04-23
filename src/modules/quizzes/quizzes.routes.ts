import { Router } from 'express';
import { QuizController } from './quizzes.controller';
import { validate } from '../../common/middleware/validate';
import { authenticate } from '../../common/middleware/authenticate';
import { aiLimiter } from '../../common/middleware/rateLimiter';
import { createQuizSchema, submitQuizSchema } from './quizzes.validator';

import { UserStatsController } from './user-stats.controller';

const router = Router();
const controller = new QuizController();

// All quiz routes require authentication
router.use(authenticate);

router.post('/', aiLimiter, validate(createQuizSchema), (req, res, next) => controller.createQuiz(req, res, next));
router.get('/history', (req, res, next) => controller.getHistory(req, res, next));
router.get('/stats', (req, res, next) => UserStatsController.getStats(req, res, next));
router.get('/progress', (req, res, next) => UserStatsController.getProgress(req, res, next));
router.get('/:sessionId', (req, res, next) => controller.getSession(req, res, next));
router.post('/:sessionId/submit', validate(submitQuizSchema), (req, res, next) => controller.submitQuiz(req, res, next));
router.get('/:sessionId/result', (req, res, next) => controller.getResult(req, res, next));

export default router;
