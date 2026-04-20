import { Router } from 'express';
import { CatalogController } from './catalog.controller';

const router = Router();
const controller = new CatalogController();

// Exams
router.get('/exams', (req, res, next) => controller.getExams(req, res, next));
router.get('/exams/:examId', (req, res, next) => controller.getExam(req, res, next));
router.get('/exams/:examId/subjects', (req, res, next) => controller.getSubjectsByExam(req, res, next));

// Subjects
router.get('/subjects/:subjectId', (req, res, next) => controller.getSubject(req, res, next));
router.get('/subjects/:subjectId/topics', (req, res, next) => controller.getTopicsBySubject(req, res, next));

// Topics
router.get('/topics/search', (req, res, next) => controller.searchTopics(req, res, next));
router.get('/topics/:topicId', (req, res, next) => controller.getTopic(req, res, next));

export default router;
