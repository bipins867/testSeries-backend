import { Op, literal } from 'sequelize';
import { Question, QuestionOption, Topic } from '../../database/models';

export class QuestionRepository {
  /**
   * Find usable questions for a topic + difficulty, excluding already-served IDs.
   * Orders by times_served ASC (least served first) for cross-session rotation.
   */
  async findAvailableQuestions(params: {
    topicId: number;
    difficulty?: string;
    excludeIds?: string[];
    limit: number;
  }) {
    const where: any = {
      topic_id: params.topicId,
      is_active: true,
      review_status: { [Op.in]: ['approved', 'pending'] },
    };

    if (params.difficulty && params.difficulty !== 'Mixed') {
      where.difficulty = params.difficulty;
    }

    if (params.excludeIds && params.excludeIds.length > 0) {
      where.id = { [Op.notIn]: params.excludeIds };
    }

    return Question.findAll({
      where,
      include: [
        { model: QuestionOption, as: 'options', attributes: ['option_index', 'option_text'] },
      ],
      order: [
        ['times_served', 'ASC'],
        ['last_served_at', 'ASC'],
        literal('RAND()'),
      ],
      limit: params.limit,
    });
  }

  /**
   * Count available questions for a topic + difficulty.
   */
  async countAvailableQuestions(topicId: number, difficulty?: string) {
    const where: any = {
      topic_id: topicId,
      is_active: true,
      review_status: { [Op.in]: ['approved', 'pending'] },
    };
    if (difficulty && difficulty !== 'Mixed') {
      where.difficulty = difficulty;
    }
    return Question.count({ where });
  }

  /**
   * Create a new question with its options.
   */
  async createQuestion(data: {
    topic_id: number;
    question_text: string;
    question_hash: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    explanation: string;
    correct_option_index: number;
    options: string[];
    source_type: 'ai_generated' | 'manual' | 'imported';
    ai_model?: string;
    ai_prompt_version?: string;
    confidence_score?: number;
    created_by?: string;
  }) {
    const question = await Question.create({
      topic_id: data.topic_id,
      question_text: data.question_text,
      question_hash: data.question_hash,
      difficulty: data.difficulty,
      explanation: data.explanation,
      correct_option_index: data.correct_option_index,
      source_type: data.source_type,
      ai_model: data.ai_model,
      ai_prompt_version: data.ai_prompt_version,
      confidence_score: data.confidence_score,
      created_by: data.created_by,
    });

    // Create options
    const optionRecords = data.options.map((text, index) => ({
      question_id: question.id,
      option_index: index,
      option_text: text,
    }));
    await QuestionOption.bulkCreate(optionRecords);

    // Fetch with options
    return Question.findByPk(question.id, {
      include: [{ model: QuestionOption, as: 'options', attributes: ['option_index', 'option_text'] }],
    });
  }

  /**
   * Check if a question with the given hash already exists.
   */
  async existsByHash(hash: string) {
    const count = await Question.count({ where: { question_hash: hash } });
    return count > 0;
  }

  /**
   * Update times_served and last_served_at for served questions.
   */
  async markQuestionsServed(questionIds: string[]) {
    if (questionIds.length === 0) return;
    await Question.update(
      {
        times_served: literal('times_served + 1'),
        last_served_at: new Date(),
      } as any,
      { where: { id: { [Op.in]: questionIds } } },
    );
  }

  /**
   * Update question stats after a quiz is submitted.
   */
  async updateQuestionStats(questionId: string, isCorrect: boolean) {
    const question = await Question.findByPk(questionId);
    if (!question) return;

    const newTotalAttempts = question.total_attempts + 1;
    const currentCorrect = question.success_rate
      ? Math.round((Number(question.success_rate) / 100) * question.total_attempts)
      : 0;
    const newCorrect = currentCorrect + (isCorrect ? 1 : 0);
    const newSuccessRate = (newCorrect / newTotalAttempts) * 100;

    await Question.update(
      { total_attempts: newTotalAttempts, success_rate: newSuccessRate },
      { where: { id: questionId } },
    );
  }

  /**
   * Find a question by ID with options.
   */
  async findById(id: string) {
    return Question.findByPk(id, {
      include: [
        { model: QuestionOption, as: 'options', attributes: ['option_index', 'option_text'] },
        { model: Topic, as: 'topic', attributes: ['id', 'name'] },
      ],
    });
  }

  /**
   * Find questions with filters (for admin panel).
   */
  async findWithFilters(params: {
    topicId?: number;
    difficulty?: string;
    sourceType?: string;
    reviewStatus?: string;
    isActive?: boolean;
    search?: string;
    offset: number;
    limit: number;
  }) {
    const where: any = {};
    if (params.topicId) where.topic_id = params.topicId;
    if (params.difficulty) where.difficulty = params.difficulty;
    if (params.sourceType) where.source_type = params.sourceType;
    if (params.reviewStatus) where.review_status = params.reviewStatus;
    if (params.isActive !== undefined) where.is_active = params.isActive;
    if (params.search) {
      where.question_text = { [Op.like]: `%${params.search}%` };
    }

    const { count, rows } = await Question.findAndCountAll({
      where,
      include: [
        { model: QuestionOption, as: 'options', attributes: ['option_index', 'option_text'] },
        { model: Topic, as: 'topic', attributes: ['id', 'name'] },
      ],
      offset: params.offset,
      limit: params.limit,
      order: [['created_at', 'DESC']],
    });

    return { total: count, questions: rows };
  }

  /**
   * Update a question.
   */
  async updateQuestion(id: string, data: Partial<{
    question_text: string;
    question_hash: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    explanation: string;
    correct_option_index: number;
    review_status: string;
    is_active: boolean;
    reviewed_by: string;
    reviewed_at: Date;
  }>) {
    await Question.update(data as any, { where: { id } });
    return this.findById(id);
  }
}
