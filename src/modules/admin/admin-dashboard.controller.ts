import { Request, Response, NextFunction } from 'express';
import { sequelize, User, QuizSession, QuizResult, Question, AiGenerationLog, TopicSearchLog, Exam, Subject, Bookmark } from '../../database/models';
import { ApiResponse } from '../../common/responses/ApiResponse';
import { Op, fn, col, literal } from 'sequelize';

export class AdminDashboardController {
  /**
   * GET /admin/analytics/dashboard
   * Enhanced overview with active users, trends, and completion rates
   */
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Basic counts
      const [totalUsers, activeUsers, totalQuestions, totalSessions, completedSessions, totalAiGenerated, pendingReview] = await Promise.all([
        User.count(),
        User.count({ where: { last_login_at: { [Op.gte]: sevenDaysAgo } } }),
        Question.count({ where: { is_active: true } }),
        QuizSession.count(),
        QuizSession.count({ where: { status: 'submitted' } }),
        Question.count({ where: { source_type: 'ai_generated' } }),
        Question.count({ where: { review_status: 'pending' } }),
      ]);

      // Average accuracy across all results
      const avgAccuracyResult = await QuizResult.findOne({
        attributes: [[fn('AVG', col('accuracy')), 'avgAccuracy']],
        raw: true,
      }) as any;
      const avgAccuracy = Math.round(avgAccuracyResult?.avgAccuracy || 0);

      // Completion rate
      const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

      // New users this week
      const newUsersThisWeek = await User.count({
        where: { created_at: { [Op.gte]: sevenDaysAgo } },
      });

      // Sessions this week vs last week for trend
      const sessionsThisWeek = await QuizSession.count({
        where: { created_at: { [Op.gte]: sevenDaysAgo } },
      });
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const sessionsLastWeek = await QuizSession.count({
        where: {
          created_at: {
            [Op.gte]: fourteenDaysAgo,
            [Op.lt]: sevenDaysAgo,
          },
        },
      });

      // Daily sessions for last 7 days
      const dailySessions = await QuizSession.findAll({
        attributes: [
          [fn('DATE', col('started_at')), 'date'],
          [fn('COUNT', col('id')), 'count'],
        ],
        where: { started_at: { [Op.gte]: sevenDaysAgo } },
        group: [fn('DATE', col('started_at'))],
        order: [[fn('DATE', col('started_at')), 'ASC']],
        raw: true,
      });

      return ApiResponse.success(res, {
        totalUsers,
        activeUsers,
        newUsersThisWeek,
        totalQuestions,
        totalSessions,
        completedSessions,
        completionRate,
        avgAccuracy,
        totalAiGenerated,
        pendingReview,
        sessionsThisWeek,
        sessionsLastWeek,
        sessionsTrend: sessionsLastWeek > 0
          ? Math.round(((sessionsThisWeek - sessionsLastWeek) / sessionsLastWeek) * 100)
          : sessionsThisWeek > 0 ? 100 : 0,
        dailySessions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/analytics/activity-trends
   * Daily activity for the last 30 days
   */
  static async getActivityTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [dailySessions, dailyUsers, dailyQuestions] = await Promise.all([
        QuizSession.findAll({
          attributes: [
            [fn('DATE', col('started_at')), 'date'],
            [fn('COUNT', col('id')), 'sessions'],
          ],
          where: { started_at: { [Op.gte]: thirtyDaysAgo } },
          group: [fn('DATE', col('started_at'))],
          order: [[fn('DATE', col('started_at')), 'ASC']],
          raw: true,
        }),
        User.findAll({
          attributes: [
            [fn('DATE', col('created_at')), 'date'],
            [fn('COUNT', col('id')), 'registrations'],
          ],
          where: { created_at: { [Op.gte]: thirtyDaysAgo } },
          group: [fn('DATE', col('created_at'))],
          order: [[fn('DATE', col('created_at')), 'ASC']],
          raw: true,
        }),
        Question.findAll({
          attributes: [
            [fn('DATE', col('created_at')), 'date'],
            [fn('COUNT', col('id')), 'questions'],
          ],
          where: { created_at: { [Op.gte]: thirtyDaysAgo } },
          group: [fn('DATE', col('created_at'))],
          order: [[fn('DATE', col('created_at')), 'ASC']],
          raw: true,
        }),
      ]);

      return ApiResponse.success(res, { dailySessions, dailyUsers, dailyQuestions });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/analytics/exam-stats
   * Popular exams and subjects breakdown
   */
  static async getExamStats(req: Request, res: Response, next: NextFunction) {
    try {
      // Sessions by exam
      const examStats = await QuizSession.findAll({
        attributes: [
          'exam_id',
          [fn('COUNT', col('QuizSession.id')), 'sessionCount'],
        ],
        include: [{ model: Exam, as: 'exam', attributes: ['id', 'name'] }],
        where: { exam_id: { [Op.ne]: null } },
        group: ['exam_id', 'exam.id'],
        order: [[fn('COUNT', col('QuizSession.id')), 'DESC']],
        raw: true,
        nest: true,
      });

      // Sessions by subject
      const subjectStats = await QuizSession.findAll({
        attributes: [
          'subject_id',
          [fn('COUNT', col('QuizSession.id')), 'sessionCount'],
        ],
        include: [{ model: Subject, as: 'subject', attributes: ['id', 'name'] }],
        where: { subject_id: { [Op.ne]: null } },
        group: ['subject_id', 'subject.id'],
        order: [[fn('COUNT', col('QuizSession.id')), 'DESC']],
        limit: 10,
        raw: true,
        nest: true,
      });

      return ApiResponse.success(res, { examStats, subjectStats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/users/:id
   * Detailed user profile with aggregate stats
   */
  static async getUserDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const user = await User.findOne({
        where: { id },
        attributes: { exclude: ['password_hash'] },
      });

      if (!user) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      // Aggregate quiz stats
      const [totalSessions, completedSessions, avgResult, recentSessions, bookmarkCount] = await Promise.all([
        QuizSession.count({ where: { user_id: id } }),
        QuizSession.count({ where: { user_id: id, status: 'submitted' } }),
        QuizResult.findOne({
          attributes: [
            [fn('AVG', col('accuracy')), 'avgAccuracy'],
            [fn('MAX', col('accuracy')), 'bestAccuracy'],
            [fn('MIN', col('accuracy')), 'worstAccuracy'],
            [fn('SUM', col('correct')), 'totalCorrect'],
            [fn('SUM', col('total_questions')), 'totalQuestions'],
          ],
          where: { user_id: id },
          raw: true,
        }),
        QuizSession.findAll({
          where: { user_id: id },
          include: [
            { model: QuizResult, as: 'result', attributes: ['score', 'accuracy', 'total_questions', 'correct', 'incorrect'] },
          ],
          order: [['created_at', 'DESC']],
          limit: 10,
        }),
        Bookmark.count({ where: { user_id: id } }),
      ]);

      const stats = avgResult as any;

      return ApiResponse.success(res, {
        user,
        stats: {
          totalSessions,
          completedSessions,
          avgAccuracy: Math.round(stats?.avgAccuracy || 0),
          bestAccuracy: Math.round(stats?.bestAccuracy || 0),
          worstAccuracy: Math.round(stats?.worstAccuracy || 0),
          totalCorrect: parseInt(stats?.totalCorrect || '0'),
          totalQuestions: parseInt(stats?.totalQuestions || '0'),
          bookmarkCount,
        },
        recentSessions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/users/:id/quiz-history
   * Paginated quiz history for a specific user
   */
  static async getUserQuizHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const { count, rows } = await QuizSession.findAndCountAll({
        where: { user_id: id },
        include: [
          { model: QuizResult, as: 'result', attributes: ['score', 'accuracy', 'total_questions', 'correct', 'incorrect', 'skipped'] },
        ],
        order: [['created_at', 'DESC']],
        offset,
        limit,
      });

      return ApiResponse.paginated(res, rows, count, page, limit);
    } catch (error) {
      next(error);
    }
  }
}
