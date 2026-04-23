import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { authorize } from '../../common/middleware/authorize';
import { ROLES } from '../../common/constants';
import { AdminUsersController } from './admin-users.controller';
import { AdminQuestionsController } from './admin-questions.controller';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { CatalogService } from '../catalog/catalog.service';
import { ApiResponse } from '../../common/responses/ApiResponse';

const router = Router();
const usersCtrl = new AdminUsersController();
const questionsCtrl = new AdminQuestionsController();
const analyticsCtrl = new AdminAnalyticsController();
const catalogService = new CatalogService();

// All admin routes require admin auth
router.use(authenticate);
router.use(authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN));

// ─── Users ─────────────────────────────────
router.get('/users', (req, res, next) => usersCtrl.listUsers(req, res, next));
router.get('/users/:id', (req, res, next) => AdminDashboardController.getUserDetail(req, res, next));
router.get('/users/:id/quiz-history', (req, res, next) => AdminDashboardController.getUserQuizHistory(req, res, next));
router.patch('/users/:id', (req, res, next) => usersCtrl.updateUser(req, res, next));

// ─── Questions ─────────────────────────────────
router.get('/questions', (req, res, next) => questionsCtrl.listQuestions(req, res, next));
router.get('/questions/:id', (req, res, next) => questionsCtrl.getQuestion(req, res, next));
router.patch('/questions/:id', (req, res, next) => questionsCtrl.updateQuestion(req, res, next));
router.patch('/questions/:id/status', (req, res, next) => questionsCtrl.updateStatus(req, res, next));

// ─── Catalog management ─────────────────────────────────
router.post('/exams', async (req, res, next) => {
  try {
    const exam = await catalogService.createExam(req.body);
    return ApiResponse.created(res, exam);
  } catch (err) { next(err); }
});
router.patch('/exams/:id', async (req, res, next) => {
  try {
    const exam = await catalogService.updateExam(parseInt(req.params.id, 10), req.body);
    return ApiResponse.success(res, exam);
  } catch (err) { next(err); }
});
router.post('/subjects', async (req, res, next) => {
  try {
    const subject = await catalogService.createSubject(req.body);
    return ApiResponse.created(res, subject);
  } catch (err) { next(err); }
});
router.patch('/subjects/:id', async (req, res, next) => {
  try {
    const subject = await catalogService.updateSubject(parseInt(req.params.id, 10), req.body);
    return ApiResponse.success(res, subject);
  } catch (err) { next(err); }
});
router.post('/topics', async (req, res, next) => {
  try {
    const topic = await catalogService.createTopic(req.body);
    return ApiResponse.created(res, topic);
  } catch (err) { next(err); }
});
router.patch('/topics/:id', async (req, res, next) => {
  try {
    const topic = await catalogService.updateTopic(parseInt(req.params.id, 10), req.body);
    return ApiResponse.success(res, topic);
  } catch (err) { next(err); }
});

// ─── Analytics ─────────────────────────────────
router.get('/analytics/overview', (req, res, next) => analyticsCtrl.getOverview(req, res, next));
router.get('/analytics/dashboard', (req, res, next) => AdminDashboardController.getDashboard(req, res, next));
router.get('/analytics/activity-trends', (req, res, next) => AdminDashboardController.getActivityTrends(req, res, next));
router.get('/analytics/exam-stats', (req, res, next) => AdminDashboardController.getExamStats(req, res, next));
router.get('/analytics/ai-usage', (req, res, next) => analyticsCtrl.getAiUsage(req, res, next));
router.get('/analytics/popular-topics', (req, res, next) => analyticsCtrl.getPopularTopics(req, res, next));
router.get('/audit-logs', (req, res, next) => analyticsCtrl.getAuditLogs(req, res, next));

export default router;
