import { Request, Response, NextFunction } from 'express';
import { QuizSession, QuizResult, UserAnswer, Bookmark, Topic, Subject } from '../../database/models';
import { ApiResponse } from '../../common/responses/ApiResponse';
import { Op, fn, col, literal } from 'sequelize';

/**
 * User-facing stats and progress controller.
 * These endpoints help build the user dashboard and progress page.
 */
export class UserStatsController {
  /**
   * GET /quizzes/stats
   * Aggregate stats for the authenticated user
   */
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;

      const [totalSessions, completedSessions, activeSessions, resultAgg, bookmarkCount] = await Promise.all([
        QuizSession.count({ where: { user_id: userId } }),
        QuizSession.count({ where: { user_id: userId, status: 'submitted' } }),
        QuizSession.count({ where: { user_id: userId, status: 'active' } }),
        QuizResult.findOne({
          attributes: [
            [fn('AVG', col('accuracy')), 'avgAccuracy'],
            [fn('MAX', col('accuracy')), 'bestAccuracy'],
            [fn('SUM', col('correct')), 'totalCorrect'],
            [fn('SUM', col('total_questions')), 'totalQuestions'],
            [fn('SUM', col('attempted')), 'totalAttempted'],
          ],
          where: { user_id: userId },
          raw: true,
        }),
        Bookmark.count({ where: { user_id: userId } }),
      ]);

      const agg = resultAgg as any;

      // Recent 10 quiz accuracy for trend
      const recentAccuracy = await QuizResult.findAll({
        attributes: ['accuracy', 'created_at'],
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 10,
        raw: true,
      });

      return ApiResponse.success(res, {
        totalSessions,
        completedSessions,
        activeSessions,
        avgAccuracy: Math.round(agg?.avgAccuracy || 0),
        bestAccuracy: Math.round(agg?.bestAccuracy || 0),
        totalCorrect: parseInt(agg?.totalCorrect || '0'),
        totalQuestions: parseInt(agg?.totalQuestions || '0'),
        totalAttempted: parseInt(agg?.totalAttempted || '0'),
        bookmarkCount,
        recentAccuracyTrend: recentAccuracy.reverse(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /quizzes/progress
   * Per-topic and per-subject performance data for the authenticated user
   */
  static async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;

      // Topic-wise breakdown: join quiz sessions (submitted) with results
      const topicWise = await QuizSession.findAll({
        attributes: [
          'topic_text',
          [fn('COUNT', col('QuizSession.id')), 'attempts'],
          [fn('AVG', literal('`result`.`accuracy`')), 'avgAccuracy'],
          [fn('SUM', literal('`result`.`correct`')), 'totalCorrect'],
          [fn('SUM', literal('`result`.`total_questions`')), 'totalQuestions'],
        ],
        include: [{
          model: QuizResult,
          as: 'result',
          attributes: [],
          required: true,
        }],
        where: { user_id: userId, status: 'submitted' },
        group: ['topic_text'],
        order: [[fn('COUNT', col('QuizSession.id')), 'DESC']],
        limit: 20,
        raw: true,
      });

      // Difficulty-wise breakdown
      const difficultyWise = await QuizSession.findAll({
        attributes: [
          'difficulty',
          [fn('COUNT', col('QuizSession.id')), 'attempts'],
          [fn('AVG', literal('`result`.`accuracy`')), 'avgAccuracy'],
        ],
        include: [{
          model: QuizResult,
          as: 'result',
          attributes: [],
          required: true,
        }],
        where: { user_id: userId, status: 'submitted' },
        group: ['difficulty'],
        raw: true,
      });

      // Accuracy trend over time (last 20 completed quizzes)
      const accuracyTrend = await QuizResult.findAll({
        attributes: ['accuracy', 'score', 'total_questions', 'created_at'],
        where: { user_id: userId },
        order: [['created_at', 'ASC']],
        limit: 20,
        raw: true,
      });

      // Weak topics: topics with avgAccuracy < 50%
      const weakTopics = (topicWise as any[])
        .filter((t: any) => parseFloat(t.avgAccuracy) < 50)
        .map((t: any) => ({
          topic: t.topic_text,
          avgAccuracy: Math.round(parseFloat(t.avgAccuracy)),
          attempts: parseInt(t.attempts),
        }));

      // Strong topics: topics with avgAccuracy >= 70%
      const strongTopics = (topicWise as any[])
        .filter((t: any) => parseFloat(t.avgAccuracy) >= 70)
        .map((t: any) => ({
          topic: t.topic_text,
          avgAccuracy: Math.round(parseFloat(t.avgAccuracy)),
          attempts: parseInt(t.attempts),
        }));

      return ApiResponse.success(res, {
        topicWise: (topicWise as any[]).map((t: any) => ({
          topic: t.topic_text,
          attempts: parseInt(t.attempts),
          avgAccuracy: Math.round(parseFloat(t.avgAccuracy || '0')),
          totalCorrect: parseInt(t.totalCorrect || '0'),
          totalQuestions: parseInt(t.totalQuestions || '0'),
        })),
        difficultyWise: (difficultyWise as any[]).map((d: any) => ({
          difficulty: d.difficulty,
          attempts: parseInt(d.attempts),
          avgAccuracy: Math.round(parseFloat(d.avgAccuracy || '0')),
        })),
        accuracyTrend,
        weakTopics,
        strongTopics,
      });
    } catch (error) {
      next(error);
    }
  }
}
