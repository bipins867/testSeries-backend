import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../common/responses/ApiResponse';
import { getPagination } from '../../common/utils/pagination';
import { sequelize } from '../../database/connection';
import {
  User,
  Question,
  QuizSession,
  QuizResult,
  AiGenerationLog,
  TopicSearchLog,
  AdminAuditLog,
  Topic,
} from '../../database/models';
import { Op, fn, col, literal } from 'sequelize';

export class AdminAnalyticsController {
  async getOverview(_req: Request, res: Response, next: NextFunction) {
    try {
      const [
        totalUsers,
        totalQuestions,
        totalSessions,
        totalAiGenerated,
        activeQuestions,
        pendingReview,
      ] = await Promise.all([
        User.count(),
        Question.count(),
        QuizSession.count({ where: { status: 'submitted' } }),
        Question.count({ where: { source_type: 'ai_generated' } }),
        Question.count({ where: { is_active: true } }),
        Question.count({ where: { review_status: 'pending' } }),
      ]);

      return ApiResponse.success(res, {
        totalUsers,
        totalQuestions,
        totalSessions,
        totalAiGenerated,
        activeQuestions,
        pendingReview,
      });
    } catch (err) { next(err); }
  }

  async getAiUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const { offset, limit, page } = getPagination(req);

      const { count, rows } = await AiGenerationLog.findAndCountAll({
        include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }],
        order: [['created_at', 'DESC']],
        offset,
        limit,
      });

      return ApiResponse.paginated(res, rows, count, page, limit);
    } catch (err) { next(err); }
  }

  async getPopularTopics(_req: Request, res: Response, next: NextFunction) {
    try {
      const popular = await TopicSearchLog.findAll({
        attributes: [
          'normalized_topic',
          [fn('COUNT', col('id')), 'search_count'],
          [fn('SUM', col('served_from_ai')), 'total_ai_generated'],
          [fn('SUM', col('served_from_db')), 'total_from_db'],
        ],
        group: ['normalized_topic'],
        order: [[literal('search_count'), 'DESC']],
        limit: 20,
      });

      return ApiResponse.success(res, popular);
    } catch (err) { next(err); }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { offset, limit, page } = getPagination(req);

      const { count, rows } = await AdminAuditLog.findAndCountAll({
        include: [{ model: User, as: 'admin', attributes: ['id', 'email', 'first_name', 'last_name'] }],
        order: [['created_at', 'DESC']],
        offset,
        limit,
      });

      return ApiResponse.paginated(res, rows, count, page, limit);
    } catch (err) { next(err); }
  }
}
