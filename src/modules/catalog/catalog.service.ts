import { CatalogRepository } from './catalog.repository';
import { NotFoundError, ConflictError } from '../../common/errors';
import { slugify, normalizeTopic } from '../../common/utils/slug';

const catalogRepo = new CatalogRepository();

export class CatalogService {
  // ─── Exams ─────────────────────────────────
  async getAllExams() {
    return catalogRepo.findAllExams();
  }

  async getExamById(id: number) {
    const exam = await catalogRepo.findExamById(id);
    if (!exam) throw new NotFoundError('Exam not found');
    return exam;
  }

  async createExam(data: { name: string; description?: string }) {
    const slug = slugify(data.name);
    return catalogRepo.createExam({ ...data, slug });
  }

  async updateExam(id: number, data: Partial<{ name: string; description: string; is_active: boolean; display_order: number }>) {
    const exam = await this.getExamById(id);
    const updateData: any = { ...data };
    if (data.name) updateData.slug = slugify(data.name);
    return catalogRepo.updateExam(id, updateData);
  }

  // ─── Subjects ─────────────────────────────────
  async getSubjectsByExam(examId: number) {
    await this.getExamById(examId); // validate exam exists
    return catalogRepo.findSubjectsByExam(examId);
  }

  async getSubjectById(id: number) {
    const subject = await catalogRepo.findSubjectById(id);
    if (!subject) throw new NotFoundError('Subject not found');
    return subject;
  }

  async createSubject(data: { exam_id: number; name: string; description?: string }) {
    await this.getExamById(data.exam_id);
    const slug = slugify(data.name);
    return catalogRepo.createSubject({ ...data, slug });
  }

  async updateSubject(id: number, data: Partial<{ name: string; description: string; is_active: boolean; display_order: number }>) {
    await this.getSubjectById(id);
    const updateData: any = { ...data };
    if (data.name) updateData.slug = slugify(data.name);
    return catalogRepo.updateSubject(id, updateData);
  }

  // ─── Topics ─────────────────────────────────
  async getTopicsBySubject(subjectId: number) {
    await this.getSubjectById(subjectId);
    return catalogRepo.findTopicsBySubject(subjectId);
  }

  async getTopicById(id: number) {
    const topic = await catalogRepo.findTopicById(id);
    if (!topic) throw new NotFoundError('Topic not found');
    return topic;
  }

  async searchTopics(query: string) {
    if (!query || query.trim().length < 2) return [];
    return catalogRepo.searchTopics(query.trim());
  }

  async findOrCreateTopicByName(topicName: string, subjectId?: number) {
    const normalized = normalizeTopic(topicName);
    let topic = await catalogRepo.findTopicByNormalizedName(normalized);
    if (topic) return topic;

    // Auto-create under a default subject if none matched
    // Use the first subject's ID if subjectId not provided
    const targetSubjectId = subjectId || 1; // Default to first subject

    const slug = slugify(topicName);
    topic = await catalogRepo.createTopic({
      subject_id: targetSubjectId,
      name: topicName.trim(),
      slug,
      normalized_name: normalized,
    });
    return topic;
  }

  async createTopic(data: { subject_id: number; name: string; description?: string }) {
    await this.getSubjectById(data.subject_id);
    const slug = slugify(data.name);
    const normalized = normalizeTopic(data.name);
    return catalogRepo.createTopic({ ...data, slug, normalized_name: normalized });
  }

  async updateTopic(id: number, data: Partial<{ name: string; description: string; is_active: boolean; display_order: number }>) {
    await this.getTopicById(id);
    const updateData: any = { ...data };
    if (data.name) {
      updateData.slug = slugify(data.name);
      updateData.normalized_name = normalizeTopic(data.name);
    }
    return catalogRepo.updateTopic(id, updateData);
  }
}
