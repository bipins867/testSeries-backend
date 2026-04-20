import { Request, Response, NextFunction } from 'express';
import { Bookmark, Question, QuestionOption, Topic } from '../../database/models';
import { ApiResponse } from '../../common/responses/ApiResponse';
import { AuthenticatedRequest } from '../../common/middleware/authenticate';
import { NotFoundError, ConflictError } from '../../common/errors';
import { getPagination } from '../../common/utils/pagination';

export class BookmarkController {
  async addBookmark(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { question_id, note } = req.body;

      // Check question exists
      const question = await Question.findByPk(question_id);
      if (!question) throw new NotFoundError('Question not found');

      // Check if already bookmarked
      const existing = await Bookmark.findOne({ where: { user_id: userId, question_id } });
      if (existing) throw new ConflictError('Question already bookmarked');

      const bookmark = await Bookmark.create({ user_id: userId, question_id, note });
      return ApiResponse.created(res, bookmark, 'Question bookmarked');
    } catch (err) { next(err); }
  }

  async removeBookmark(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const questionId = req.params.questionId;

      const deleted = await Bookmark.destroy({ where: { user_id: userId, question_id: questionId } });
      if (!deleted) throw new NotFoundError('Bookmark not found');

      return ApiResponse.success(res, null, 'Bookmark removed');
    } catch (err) { next(err); }
  }

  async getBookmarks(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { offset, limit, page } = getPagination(req);

      const { count, rows } = await Bookmark.findAndCountAll({
        where: { user_id: userId },
        include: [
          {
            model: Question,
            as: 'question',
            include: [
              { model: QuestionOption, as: 'options', attributes: ['option_index', 'option_text'] },
              { model: Topic, as: 'topic', attributes: ['id', 'name'] },
            ],
          },
        ],
        order: [['created_at', 'DESC']],
        offset,
        limit,
      });

      return ApiResponse.paginated(res, rows, count, page, limit);
    } catch (err) { next(err); }
  }
}
