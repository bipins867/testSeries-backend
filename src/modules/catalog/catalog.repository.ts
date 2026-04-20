import { Exam, Subject, Topic } from '../../database/models';
import { Op } from 'sequelize';

export class CatalogRepository {
  // ─── Exams ─────────────────────────────────
  async findAllExams(activeOnly = true) {
    const where: any = {};
    if (activeOnly) where.is_active = true;
    return Exam.findAll({ where, order: [['display_order', 'ASC']] });
  }

  async findExamById(id: number) {
    return Exam.findByPk(id);
  }

  async createExam(data: { name: string; slug: string; description?: string; display_order?: number }) {
    return Exam.create(data);
  }

  async updateExam(id: number, data: Partial<{ name: string; slug: string; description: string; is_active: boolean; display_order: number }>) {
    await Exam.update(data, { where: { id } });
    return Exam.findByPk(id);
  }

  // ─── Subjects ─────────────────────────────────
  async findSubjectsByExam(examId: number, activeOnly = true) {
    const where: any = { exam_id: examId };
    if (activeOnly) where.is_active = true;
    return Subject.findAll({ where, order: [['display_order', 'ASC']] });
  }

  async findSubjectById(id: number) {
    return Subject.findByPk(id, { include: [{ model: Exam, as: 'exam' }] });
  }

  async createSubject(data: { exam_id: number; name: string; slug: string; description?: string; display_order?: number }) {
    return Subject.create(data);
  }

  async updateSubject(id: number, data: Partial<{ name: string; slug: string; description: string; is_active: boolean; display_order: number }>) {
    await Subject.update(data, { where: { id } });
    return Subject.findByPk(id);
  }

  // ─── Topics ─────────────────────────────────
  async findTopicsBySubject(subjectId: number, activeOnly = true) {
    const where: any = { subject_id: subjectId };
    if (activeOnly) where.is_active = true;
    return Topic.findAll({ where, order: [['display_order', 'ASC']] });
  }

  async findTopicById(id: number) {
    return Topic.findByPk(id, {
      include: [{ model: Subject, as: 'subject', include: [{ model: Exam, as: 'exam' }] }],
    });
  }

  async findTopicByNormalizedName(normalizedName: string) {
    return Topic.findOne({ where: { normalized_name: normalizedName } });
  }

  async searchTopics(query: string, limit = 20) {
    return Topic.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { normalized_name: { [Op.like]: `%${query.toLowerCase()}%` } },
        ],
      },
      include: [{ model: Subject, as: 'subject', attributes: ['id', 'name'], include: [{ model: Exam, as: 'exam', attributes: ['id', 'name'] }] }],
      limit,
      order: [['question_count', 'DESC']],
    });
  }

  async createTopic(data: { subject_id: number; name: string; slug: string; normalized_name: string; description?: string; display_order?: number }) {
    return Topic.create(data);
  }

  async updateTopic(id: number, data: Partial<{ name: string; slug: string; normalized_name: string; description: string; is_active: boolean; display_order: number; question_count: number }>) {
    await Topic.update(data, { where: { id } });
    return Topic.findByPk(id);
  }

  async incrementTopicQuestionCount(topicId: number, increment: number) {
    await Topic.increment('question_count', { by: increment, where: { id: topicId } });
  }
}
