import { v4 as uuidv4 } from 'uuid';
import {
  QuizSession,
  QuizSessionQuestion,
  UserAnswer,
  QuizResult,
  QuestionOption,
  Question,
  Topic,
  AiGenerationLog,
  TopicSearchLog,
} from '../../database/models';
import { Op } from 'sequelize';

export class QuizRepository {
  async createSession(data: {
    user_id: string;
    exam_id?: number;
    subject_id?: number;
    topic_id?: number;
    topic_text: string;
    difficulty: string;
    mode?: string;
    question_count: number;
    questions_from_db: number;
    questions_from_ai: number;
  }) {
    return QuizSession.create({
      id: uuidv4(),
      user_id: data.user_id,
      exam_id: data.exam_id || null,
      subject_id: data.subject_id || null,
      topic_id: data.topic_id || null,
      topic_text: data.topic_text,
      difficulty: data.difficulty as any,
      mode: (data.mode as any) || 'practice',
      question_count: data.question_count,
      status: 'active',
      questions_from_db: data.questions_from_db,
      questions_from_ai: data.questions_from_ai,
      started_at: new Date(),
    });
  }

  async findSessionById(id: string) {
    return QuizSession.findByPk(id, {
      include: [
        {
          model: QuizSessionQuestion,
          as: 'sessionQuestions',
          include: [
            {
              model: Question,
              as: 'question',
              include: [{ model: QuestionOption, as: 'options', attributes: ['option_index', 'option_text'] }],
            },
          ],
          order: [['question_order', 'ASC']],
        },
      ],
    });
  }

  async findSessionByIdWithAnswers(id: string) {
    return QuizSession.findByPk(id, {
      include: [
        {
          model: QuizSessionQuestion,
          as: 'sessionQuestions',
          include: [
            {
              model: Question,
              as: 'question',
              include: [{ model: QuestionOption, as: 'options', attributes: ['option_index', 'option_text'] }],
            },
          ],
        },
        {
          model: UserAnswer,
          as: 'answers',
        },
        {
          model: QuizResult,
          as: 'result',
        },
      ],
    });
  }

  async attachQuestionsToSession(sessionId: string, questionIds: string[]) {
    const records = questionIds.map((questionId, index) => ({
      session_id: sessionId,
      question_id: questionId,
      question_order: index + 1,
    }));
    await QuizSessionQuestion.bulkCreate(records);
  }

  async getServedQuestionIds(sessionId: string): Promise<string[]> {
    const records = await QuizSessionQuestion.findAll({
      where: { session_id: sessionId },
      attributes: ['question_id'],
    });
    return records.map(r => r.question_id);
  }

  async saveUserAnswers(answers: Array<{
    session_id: string;
    question_id: string;
    session_question_id: number;
    selected_option_index: number | null;
    is_correct: boolean;
    time_spent_seconds?: number;
  }>) {
    return UserAnswer.bulkCreate(answers.map(a => ({
      ...a,
      answered_at: new Date(),
    })));
  }

  async createResult(data: {
    session_id: string;
    user_id: string;
    total_questions: number;
    attempted: number;
    correct: number;
    incorrect: number;
    skipped: number;
    score: number;
    accuracy: number;
    total_time_seconds?: number;
    ai_analysis?: Record<string, unknown>;
    topic_wise_breakdown?: Record<string, unknown>;
    difficulty_wise_breakdown?: Record<string, unknown>;
  }) {
    return QuizResult.create(data);
  }

  async updateSessionStatus(id: string, status: string, submittedAt?: Date) {
    const update: any = { status };
    if (submittedAt) update.submitted_at = submittedAt;
    await QuizSession.update(update, { where: { id } });
  }

  async findResultBySessionId(sessionId: string) {
    return QuizResult.findOne({ where: { session_id: sessionId } });
  }

  async findUserQuizHistory(userId: string, offset: number, limit: number) {
    const { count, rows } = await QuizSession.findAndCountAll({
      where: { user_id: userId, status: 'submitted' },
      include: [
        { model: QuizResult, as: 'result', attributes: ['score', 'accuracy', 'total_questions', 'correct', 'incorrect', 'skipped'] },
        { model: Topic, as: 'topic', attributes: ['id', 'name'] },
      ],
      order: [['submitted_at', 'DESC']],
      offset,
      limit,
    });
    return { total: count, sessions: rows };
  }

  async logAiGeneration(data: {
    topic_id?: number;
    topic_text: string;
    difficulty: string;
    requested_count: number;
    generated_count: number;
    valid_count: number;
    stored_count: number;
    model: string;
    generation_time_ms?: number;
    triggered_by?: string;
  }) {
    return AiGenerationLog.create(data as any);
  }

  async logTopicSearch(data: {
    user_id?: string;
    topic_text: string;
    normalized_topic: string;
    exam_id?: number;
    difficulty?: string;
    requested_count?: number;
    served_from_db: number;
    served_from_ai: number;
  }) {
    return TopicSearchLog.create(data as any);
  }

  async findSessionQuestionsForSession(sessionId: string) {
    return QuizSessionQuestion.findAll({
      where: { session_id: sessionId },
      include: [{ model: Question, as: 'question', include: [{ model: QuestionOption, as: 'options' }] }],
      order: [['question_order', 'ASC']],
    });
  }
}
