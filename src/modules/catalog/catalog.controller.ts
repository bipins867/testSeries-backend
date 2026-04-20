import { Request, Response, NextFunction } from 'express';
import { CatalogService } from './catalog.service';
import { ApiResponse } from '../../common/responses/ApiResponse';

const catalogService = new CatalogService();

export class CatalogController {
  // ─── Exams ─────────────────────────────────
  async getExams(_req: Request, res: Response, next: NextFunction) {
    try {
      const exams = await catalogService.getAllExams();
      return ApiResponse.success(res, exams);
    } catch (err) { next(err); }
  }

  async getExam(req: Request, res: Response, next: NextFunction) {
    try {
      const examId = parseInt(req.params.examId as string, 10);
      const exam = await catalogService.getExamById(examId);
      return ApiResponse.success(res, exam);
    } catch (err) { next(err); }
  }

  // ─── Subjects ─────────────────────────────────
  async getSubjectsByExam(req: Request, res: Response, next: NextFunction) {
    try {
      const examId = parseInt(req.params.examId as string, 10);
      const subjects = await catalogService.getSubjectsByExam(examId);
      return ApiResponse.success(res, subjects);
    } catch (err) { next(err); }
  }

  async getSubject(req: Request, res: Response, next: NextFunction) {
    try {
      const subjectId = parseInt(req.params.subjectId as string, 10);
      const subject = await catalogService.getSubjectById(subjectId);
      return ApiResponse.success(res, subject);
    } catch (err) { next(err); }
  }

  // ─── Topics ─────────────────────────────────
  async getTopicsBySubject(req: Request, res: Response, next: NextFunction) {
    try {
      const subjectId = parseInt(req.params.subjectId as string, 10);
      const topics = await catalogService.getTopicsBySubject(subjectId);
      return ApiResponse.success(res, topics);
    } catch (err) { next(err); }
  }

  async searchTopics(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      const topics = await catalogService.searchTopics(query);
      return ApiResponse.success(res, topics);
    } catch (err) { next(err); }
  }

  async getTopic(req: Request, res: Response, next: NextFunction) {
    try {
      const topicId = parseInt(req.params.topicId as string, 10);
      const topic = await catalogService.getTopicById(topicId);
      return ApiResponse.success(res, topic);
    } catch (err) { next(err); }
  }
}
