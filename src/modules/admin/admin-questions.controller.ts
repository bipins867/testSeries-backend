import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../common/responses/ApiResponse';
import { AuthenticatedRequest } from '../../common/middleware/authenticate';
import { getPagination } from '../../common/utils/pagination';
import { QuestionRepository } from '../questions/questions.repository';
import { NotFoundError } from '../../common/errors';
import { generateQuestionHash } from '../../common/utils/hash';
import { AdminAuditLog } from '../../database/models';

const questionRepo = new QuestionRepository();

export class AdminQuestionsController {
  async listQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { offset, limit, page } = getPagination(req);
      const { topicId, difficulty, sourceType, reviewStatus, isActive, search } = req.query;

      const { total, questions } = await questionRepo.findWithFilters({
        topicId: topicId ? parseInt(topicId as string, 10) : undefined,
        difficulty: difficulty as string | undefined,
        sourceType: sourceType as string | undefined,
        reviewStatus: reviewStatus as string | undefined,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search: search as string | undefined,
        offset,
        limit,
      });

      return ApiResponse.paginated(res, questions, total, page, limit);
    } catch (err) { next(err); }
  }

  async getQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const questionId = req.params.id as string;
      const question = await questionRepo.findById(questionId);
      if (!question) throw new NotFoundError('Question not found');
      return ApiResponse.success(res, question);
    } catch (err) { next(err); }
  }

  async updateQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const questionId = req.params.id as string;
      const { question_text, difficulty, explanation, correct_option_index, review_status, is_active } = req.body;

      const existing = await questionRepo.findById(questionId);
      if (!existing) throw new NotFoundError('Question not found');

      const updateData: any = {};
      if (question_text !== undefined) {
        updateData.question_text = question_text;
        updateData.question_hash = generateQuestionHash(question_text);
      }
      if (difficulty !== undefined) updateData.difficulty = difficulty;
      if (explanation !== undefined) updateData.explanation = explanation;
      if (correct_option_index !== undefined) updateData.correct_option_index = correct_option_index;
      if (review_status !== undefined) {
        updateData.review_status = review_status;
        updateData.reviewed_by = userId;
        updateData.reviewed_at = new Date();
      }
      if (is_active !== undefined) updateData.is_active = is_active;

      const updated = await questionRepo.updateQuestion(questionId, updateData);

      // Audit log
      await AdminAuditLog.create({
        admin_id: userId,
        action: 'question.update',
        entity_type: 'question',
        entity_id: questionId,
        old_values: { review_status: existing.review_status, is_active: existing.is_active },
        new_values: updateData,
        ip_address: req.ip || null,
      });

      return ApiResponse.success(res, updated, 'Question updated');
    } catch (err) { next(err); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const questionId = req.params.id as string;
      const { review_status } = req.body;

      const existing = await questionRepo.findById(questionId);
      if (!existing) throw new NotFoundError('Question not found');

      const updated = await questionRepo.updateQuestion(questionId, {
        review_status,
        reviewed_by: userId,
        reviewed_at: new Date(),
      });

      await AdminAuditLog.create({
        admin_id: userId,
        action: `question.${review_status}`,
        entity_type: 'question',
        entity_id: questionId,
        old_values: { review_status: existing.review_status },
        new_values: { review_status },
        ip_address: req.ip || null,
      });

      return ApiResponse.success(res, updated, `Question ${review_status}`);
    } catch (err) { next(err); }
  }
}
