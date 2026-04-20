import { Request, Response, NextFunction } from 'express';
import { QuizService } from './quizzes.service';
import { ApiResponse } from '../../common/responses/ApiResponse';
import { AuthenticatedRequest } from '../../common/middleware/authenticate';
import { getPagination } from '../../common/utils/pagination';

const quizService = new QuizService();

export class QuizController {
  async createQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { topic, numberOfQuestions, difficulty, mode, examId, subjectId } = req.body;

      const result = await quizService.createQuiz({
        userId,
        topic,
        numberOfQuestions,
        difficulty,
        mode,
        examId,
        subjectId,
      });

      return ApiResponse.created(res, result, 'Quiz created successfully');
    } catch (err) {
      next(err);
    }
  }

  async submitQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const sessionId = req.params.sessionId as string;
      const { answers } = req.body;

      const result = await quizService.submitQuiz({ sessionId, userId, answers });

      return ApiResponse.success(res, result, 'Quiz submitted successfully');
    } catch (err) {
      next(err);
    }
  }

  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const sessionId = req.params.sessionId as string;

      const session = await quizService.getSession(sessionId, userId);
      return ApiResponse.success(res, session);
    } catch (err) {
      next(err);
    }
  }

  async getResult(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const sessionId = req.params.sessionId as string;

      const result = await quizService.getResult(sessionId, userId);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { offset, limit, page } = getPagination(req);

      const { total, sessions } = await quizService.getHistory(userId, offset, limit);
      return ApiResponse.paginated(res, sessions, total, page, limit);
    } catch (err) {
      next(err);
    }
  }
}
