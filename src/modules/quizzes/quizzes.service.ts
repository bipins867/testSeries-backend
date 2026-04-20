import { logger } from '../../common/logger';
import { config } from '../../common/config';
import { NotFoundError, BadRequestError } from '../../common/errors';
import { generateQuestionHash } from '../../common/utils/hash';
import { normalizeTopic } from '../../common/utils/slug';
import { QuestionRepository } from '../questions/questions.repository';
import { QuizRepository } from './quizzes.repository';
import { CatalogService } from '../catalog/catalog.service';
import { OpenAiProvider } from '../ai/openai.provider';
import type { GeneratedQuestionPayload, ValidationResultPayload } from '../ai/ai.provider';

const questionRepo = new QuestionRepository();
const quizRepo = new QuizRepository();
const catalogService = new CatalogService();
const aiProvider = new OpenAiProvider();

// Map A/B/C/D to 0-3
const OPTION_INDEX_MAP: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
const INDEX_TO_LABEL: Record<number, string> = { 0: 'A', 1: 'B', 2: 'C', 3: 'D' };

export class QuizService {
  /**
   * Create a quiz session with the full DB-first → AI-fallback orchestration.
   *
   * 1. Normalize topic, find or create topic record
   * 2. Fetch available questions from DB (least-served first)
   * 3. If insufficient, generate from AI, validate, dedup, store
   * 4. Attach questions to session
   * 5. Log everything
   */
  async createQuiz(params: {
    userId: string;
    topic: string;
    numberOfQuestions: number;
    difficulty: string;
    mode?: string;
    examId?: number;
    subjectId?: number;
  }) {
    const { userId, topic, numberOfQuestions, difficulty, mode, examId, subjectId } = params;
    const startTime = Date.now();

    // 1. Find or create the topic
    const topicRecord = await catalogService.findOrCreateTopicByName(topic, subjectId);
    const topicId = topicRecord.id;

    // 2. Fetch from DB first
    let dbQuestions = await questionRepo.findAvailableQuestions({
      topicId,
      difficulty,
      limit: numberOfQuestions,
    });

    let questionsFromDb = dbQuestions.length;
    let questionsFromAi = 0;
    const selectedQuestionIds: string[] = dbQuestions.map(q => q.id);

    // 3. If not enough, generate via AI
    if (dbQuestions.length < numberOfQuestions) {
      const needed = numberOfQuestions - dbQuestions.length;
      logger.info(`[QuizService] DB has ${dbQuestions.length}/${numberOfQuestions} questions. Generating ${needed} via AI.`);

      try {
        const newQuestions = await this.generateAndStoreQuestions({
          topicId,
          topicName: topic,
          difficulty,
          count: needed,
          excludeIds: selectedQuestionIds,
          userId,
        });

        questionsFromAi = newQuestions.length;
        selectedQuestionIds.push(...newQuestions.map(q => q!.id));
      } catch (error) {
        logger.error('[QuizService] AI generation failed:', error);
        // Continue with whatever we have from DB
        if (dbQuestions.length === 0) {
          throw new BadRequestError(
            'Unable to generate questions for this topic. Please try a different topic.',
          );
        }
      }
    }

    // Trim to requested count
    const finalQuestionIds = selectedQuestionIds.slice(0, numberOfQuestions);

    if (finalQuestionIds.length === 0) {
      throw new BadRequestError('No questions available for this topic and difficulty combination.');
    }

    // 4. Create session and attach questions
    const session = await quizRepo.createSession({
      user_id: userId,
      exam_id: examId,
      subject_id: subjectId,
      topic_id: topicId,
      topic_text: topic,
      difficulty,
      mode,
      question_count: finalQuestionIds.length,
      questions_from_db: questionsFromDb,
      questions_from_ai: questionsFromAi,
    });

    await quizRepo.attachQuestionsToSession(session.id, finalQuestionIds);

    // Mark questions as served
    await questionRepo.markQuestionsServed(finalQuestionIds);

    // 5. Log the search
    await quizRepo.logTopicSearch({
      user_id: userId,
      topic_text: topic,
      normalized_topic: normalizeTopic(topic),
      exam_id: examId,
      difficulty,
      requested_count: numberOfQuestions,
      served_from_db: Math.min(questionsFromDb, numberOfQuestions),
      served_from_ai: questionsFromAi,
    });

    const elapsed = Date.now() - startTime;
    logger.info(
      `[QuizService] Quiz ${session.id} created in ${elapsed}ms — ` +
      `${questionsFromDb} from DB, ${questionsFromAi} from AI`,
    );

    // 6. Fetch full session for response
    const fullSession = await quizRepo.findSessionById(session.id);
    return this.formatQuizResponse(fullSession!);
  }

  /**
   * Submit quiz answers, evaluate, persist results, and return analysis.
   */
  async submitQuiz(params: {
    sessionId: string;
    userId: string;
    answers: Array<{ questionId: string; selected: string; timeSpent?: number }>;
  }) {
    const { sessionId, userId, answers } = params;

    // Fetch session
    const session = await quizRepo.findSessionById(sessionId);
    if (!session) throw new NotFoundError('Quiz session not found');
    if (session.user_id !== userId) throw new NotFoundError('Quiz session not found');
    if (session.status !== 'active') throw new BadRequestError('This quiz has already been submitted');

    // Build answer map
    const answerMap = new Map(answers.map(a => [a.questionId, a]));
    const sessionQuestions = (session as any).sessionQuestions || [];

    // Evaluate
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    const userAnswerRecords: any[] = [];
    const detailedResults: any[] = [];

    for (const sq of sessionQuestions) {
      const question = sq.question;
      const options = question.options?.sort((a: any, b: any) => a.option_index - b.option_index) || [];
      const correctIndex = question.correct_option_index;
      const correctLabel = INDEX_TO_LABEL[correctIndex] || 'A';

      const userAnswer = answerMap.get(question.id);
      const selectedLabel = userAnswer?.selected || null;
      const selectedIndex = selectedLabel ? (OPTION_INDEX_MAP[selectedLabel] ?? null) : null;
      const isCorrect = selectedLabel === correctLabel;

      if (!selectedLabel) {
        skipped++;
      } else if (isCorrect) {
        correct++;
      } else {
        incorrect++;
      }

      userAnswerRecords.push({
        session_id: sessionId,
        question_id: question.id,
        session_question_id: sq.id,
        selected_option_index: selectedIndex,
        is_correct: isCorrect,
        time_spent_seconds: userAnswer?.timeSpent || null,
      });

      detailedResults.push({
        id: question.id,
        question: question.question_text,
        options: options.map((o: any) => o.option_text),
        correctAnswer: correctLabel,
        userAnswer: selectedLabel || 'NOT_ANSWERED',
        explanation: question.explanation,
        isCorrect,
        difficulty: question.difficulty,
      });

      // Update question stats
      if (selectedLabel) {
        await questionRepo.updateQuestionStats(question.id, isCorrect);
      }
    }

    const totalQuestions = sessionQuestions.length;
    const attempted = totalQuestions - skipped;
    const score = correct;
    const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

    // Save answers
    await quizRepo.saveUserAnswers(userAnswerRecords);

    // AI analysis
    let aiAnalysis: any = null;
    try {
      aiAnalysis = await aiProvider.analyzePerformance(
        session.topic_text,
        detailedResults,
        answers,
        score,
        totalQuestions,
      );
    } catch (error) {
      logger.warn('[QuizService] AI analysis failed:', error);
      aiAnalysis = {
        strengths: [],
        weaknesses: [],
        summary: 'Analysis not available at this time.',
        suggestions: [],
        questionFeedback: [],
      };
    }

    // Save result
    await quizRepo.createResult({
      session_id: sessionId,
      user_id: userId,
      total_questions: totalQuestions,
      attempted,
      correct,
      incorrect,
      skipped,
      score,
      accuracy,
      ai_analysis: aiAnalysis,
    });

    // Update session status
    await quizRepo.updateSessionStatus(sessionId, 'submitted', new Date());

    // Build feedback map
    const feedbackMap = new Map(
      aiAnalysis?.questionFeedback?.map((f: any) => [f.questionId, f.feedback]) || [],
    );

    const detailedWithFeedback = detailedResults.map((r: any) => ({
      ...r,
      aiFeedback: feedbackMap.get(r.id) || (r.isCorrect ? 'Good job!' : 'Review the explanation carefully.'),
    }));

    logger.info(`[QuizService] Quiz ${sessionId} submitted — Score: ${score}/${totalQuestions}`);

    return {
      score,
      total: totalQuestions,
      attempted,
      correct,
      incorrect,
      skipped,
      accuracy: Math.round(accuracy * 100) / 100,
      analysis: aiAnalysis,
      detailedResults: detailedWithFeedback,
    };
  }

  /**
   * Get quiz result by session ID.
   */
  async getResult(sessionId: string, userId: string) {
    const session = await quizRepo.findSessionByIdWithAnswers(sessionId);
    if (!session) throw new NotFoundError('Quiz session not found');
    if (session.user_id !== userId) throw new NotFoundError('Quiz session not found');

    const result = (session as any).result;
    if (!result) throw new NotFoundError('Quiz has not been submitted yet');

    return result;
  }

  /**
   * Get user's quiz history.
   */
  async getHistory(userId: string, offset: number, limit: number) {
    return quizRepo.findUserQuizHistory(userId, offset, limit);
  }

  /**
   * Get a quiz session (for resuming or viewing).
   */
  async getSession(sessionId: string, userId: string) {
    const session = await quizRepo.findSessionById(sessionId);
    if (!session) throw new NotFoundError('Quiz session not found');
    if (session.user_id !== userId) throw new NotFoundError('Quiz session not found');
    return this.formatQuizResponse(session);
  }

  // ─── Private ────────────────────────────────────────────

  /**
   * Generate questions via AI, validate, deduplicate, and store in DB.
   * Returns the newly stored question records.
   */
  private async generateAndStoreQuestions(params: {
    topicId: number;
    topicName: string;
    difficulty: string;
    count: number;
    excludeIds: string[];
    userId: string;
  }) {
    const { topicId, topicName, difficulty, count, excludeIds, userId } = params;
    const requestCount = Math.min(Math.ceil(count * 1.5), config.quiz.maxQuestionsPerRequest);
    const startTime = Date.now();

    // Generate
    const rawQuestions = await aiProvider.generateQuestions(topicName, requestCount, difficulty);

    // Validate (anti-hallucination)
    const validations = await aiProvider.validateQuestions(rawQuestions);

    // Filter valid + high-confidence
    const filtered = this.filterQuestions(rawQuestions, validations);
    logger.info(`[QuizService] Filtered ${filtered.length}/${rawQuestions.length} valid questions`);

    // Deduplicate and store
    const stored: any[] = [];
    for (const q of filtered) {
      if (stored.length >= count) break;

      const hash = generateQuestionHash(q.question);

      // Check for duplicate
      const exists = await questionRepo.existsByHash(hash);
      if (exists) {
        logger.debug(`[QuizService] Skipping duplicate question: "${q.question.substring(0, 50)}..."`);
        continue;
      }

      const correctIndex = OPTION_INDEX_MAP[q.correctAnswer] ?? 0;

      try {
        const saved = await questionRepo.createQuestion({
          topic_id: topicId,
          question_text: q.question,
          question_hash: hash,
          difficulty: q.difficulty,
          explanation: q.explanation,
          correct_option_index: correctIndex,
          options: q.options,
          source_type: 'ai_generated',
          ai_model: config.openai.model,
          ai_prompt_version: 'v1',
          confidence_score: q.confidence,
          created_by: userId,
        });
        stored.push(saved);
      } catch (error: any) {
        // Unique constraint violation — skip duplicate
        if (error.name === 'SequelizeUniqueConstraintError') {
          logger.debug(`[QuizService] Hash collision on store — skipping`);
          continue;
        }
        throw error;
      }
    }

    const elapsed = Date.now() - startTime;

    // Log the generation
    await quizRepo.logAiGeneration({
      topic_id: topicId,
      topic_text: topicName,
      difficulty,
      requested_count: requestCount,
      generated_count: rawQuestions.length,
      valid_count: filtered.length,
      stored_count: stored.length,
      model: config.openai.model,
      generation_time_ms: elapsed,
      triggered_by: userId,
    });

    // Update topic question count
    if (stored.length > 0) {
      const { CatalogRepository } = require('../catalog/catalog.repository');
      const catRepo = new CatalogRepository();
      await catRepo.incrementTopicQuestionCount(topicId, stored.length);
    }

    return stored;
  }

  /**
   * Filter questions based on validation results and confidence.
   */
  private filterQuestions(
    questions: GeneratedQuestionPayload[],
    validations: ValidationResultPayload[],
  ): GeneratedQuestionPayload[] {
    return questions.filter((q, index) => {
      const validation = validations[index];
      if (!validation) return false;

      if (!validation.isValid) {
        logger.debug(`[Filter] Rejected: "${q.question.substring(0, 50)}..." — ${validation.issues || 'marked invalid'}`);
        return false;
      }

      if (q.confidence < config.quiz.minConfidence) {
        logger.debug(`[Filter] Rejected: "${q.question.substring(0, 50)}..." — low confidence (${q.confidence})`);
        return false;
      }

      // Apply corrected answer if needed
      if (validation.correctedAnswer && validation.correctedAnswer !== q.correctAnswer) {
        logger.debug(`[Filter] Corrected answer: ${q.correctAnswer} → ${validation.correctedAnswer}`);
        q.correctAnswer = validation.correctedAnswer;
      }

      return true;
    });
  }

  /**
   * Format a session into the client-facing quiz response.
   * Strips correct answers for active quizzes.
   */
  private formatQuizResponse(session: any) {
    const sessionQuestions = session.sessionQuestions || [];

    const questions = sessionQuestions
      .sort((a: any, b: any) => a.question_order - b.question_order)
      .map((sq: any) => {
        const q = sq.question;
        const options = q.options?.sort((a: any, b: any) => a.option_index - b.option_index) || [];

        return {
          id: q.id,
          question: q.question_text,
          options: options.map((o: any) => o.option_text),
          difficulty: q.difficulty,
        };
      });

    return {
      sessionId: session.id,
      topic: session.topic_text,
      difficulty: session.difficulty,
      mode: session.mode,
      status: session.status,
      questionCount: session.question_count,
      questionsFromDb: session.questions_from_db,
      questionsFromAi: session.questions_from_ai,
      questions,
    };
  }
}
