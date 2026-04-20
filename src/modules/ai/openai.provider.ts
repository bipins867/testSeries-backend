import OpenAI from 'openai';
import { config } from '../../common/config';
import { logger } from '../../common/logger';
import { withRetry } from './utils/retry';
import { parseJsonFromAI, extractArrayFromAI } from './utils/jsonParser';
import type { AiProvider, GeneratedQuestionPayload, ValidationResultPayload, AnalysisPayload } from './ai.provider';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * OpenAI-based implementation of the AI provider interface.
 * Preserves all existing prompt logic from the original backend.
 */
export class OpenAiProvider implements AiProvider {
  async generateQuestions(
    topic: string,
    count: number,
    difficulty: string,
  ): Promise<GeneratedQuestionPayload[]> {
    const systemPrompt = `You are an expert UPSC Civil Services Examination question setter with deep knowledge of Indian history, polity, geography, economy, science, and current affairs.`;

    let difficultyInstruction = `- Assign a difficulty level ("Easy", "Medium", or "Hard") based on complexity`;
    if (difficulty !== 'Mixed') {
      difficultyInstruction = `- Ensure all questions have a difficulty level of EXACTLY "${difficulty}"`;
    }

    const userPrompt = `Generate exactly ${count} UPSC Prelims level MCQs on the topic: "${topic}".

Rules:
- Questions must be based STRICTLY on the given topic
- Each question must have exactly 4 options labeled A, B, C, D
- Only 1 correct answer per question
- Include a concise explanation for the correct answer
- Avoid ambiguous, controversial, or opinion-based facts
- Ensure factual accuracy — use only well-established, widely-accepted knowledge
${difficultyInstruction}
- Assign a confidence score (0 to 1) indicating how certain you are about the factual accuracy

Return a JSON object in this EXACT format:
{
  "questions": [
    {
      "question": "The question text here",
      "options": ["A) Option A text", "B) Option B text", "C) Option C text", "D) Option D text"],
      "correctAnswer": "A",
      "explanation": "Brief explanation of the correct answer",
      "difficulty": "Medium",
      "confidence": 0.95
    }
  ]
}`;

    return withRetry(async () => {
      logger.info(`[AI] Generating ${count} questions on topic: "${topic}"`);
      const startTime = Date.now();

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        temperature: config.openai.generationTemperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI during question generation');

      const questions = extractArrayFromAI<GeneratedQuestionPayload>(content);
      const elapsed = Date.now() - startTime;

      logger.info(`[AI] Generated ${questions.length} questions in ${elapsed}ms`);
      return questions;
    }, config.quiz.maxRetries);
  }

  async validateQuestions(questions: GeneratedQuestionPayload[]): Promise<ValidationResultPayload[]> {
    const systemPrompt = `You are a senior UPSC examiner and fact-checker. Your job is to rigorously validate Multiple Choice Questions for factual accuracy, answer correctness, and clarity. Be strict — if there is ANY doubt about a fact, mark the question as invalid.`;

    const userPrompt = `Validate the following ${questions.length} MCQs intended for a UPSC Prelims examination:

${JSON.stringify(questions, null, 2)}

For EACH of the ${questions.length} questions above, check:
1. Is the stated correct answer actually correct?
2. Is the question free from ambiguity — is there exactly one defensible answer?
3. Are all stated facts accurate and not hallucinated?
4. Are the distractor options plausible but clearly incorrect?

IMPORTANT: You MUST return exactly ${questions.length} validation entries — one for each question, in the same order.

Return a JSON object in this EXACT format:
{
  "validations": [
    { "isValid": true, "correctedAnswer": "A", "issues": "" },
    { "isValid": false, "correctedAnswer": "B", "issues": "The stated fact is incorrect..." }
  ]
}`;

    return withRetry(async () => {
      logger.info(`[AI] Validating ${questions.length} questions`);

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        temperature: config.openai.validationTemperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI during validation');

      const results = extractArrayFromAI<ValidationResultPayload>(content);
      logger.info(`[AI] Validation complete — ${results.filter(r => r.isValid).length}/${results.length} valid`);
      return results;
    }, config.quiz.maxRetries);
  }

  async analyzePerformance(
    topic: string,
    questions: any[],
    answers: any[],
    score: number,
    total: number,
  ): Promise<AnalysisPayload> {
    const answerMap = new Map(answers.map((a: any) => [a.questionId, a.selected]));

    const breakdown = questions.map((q: any) => ({
      questionId: q.id,
      question: q.question_text || q.question,
      correctAnswer: q.correctAnswer || q.correct_option_label,
      userAnswer: answerMap.get(q.id) ?? 'NOT_ANSWERED',
      isCorrect: answerMap.get(q.id) === (q.correctAnswer || q.correct_option_label),
      explanation: q.explanation,
    }));

    const systemPrompt = `You are an expert UPSC mentor. Analyze the aspirant's quiz performance and give actionable, specific feedback to help them improve.`;

    const userPrompt = `A UPSC aspirant attempted a quiz on: "${topic}"
Score: ${score}/${total}

Detailed breakdown:
${JSON.stringify(breakdown, null, 2)}

Provide a thorough analysis. Return ONLY valid JSON (no extra text):
{
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "summary": "A brief overall performance summary paragraph",
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2"],
  "questionFeedback": [
    { "questionId": "ID-FROM-BREAKDOWN", "feedback": "Brief personalized feedback." }
  ]
}`;

    return withRetry(async () => {
      logger.info(`[AI] Analyzing performance for topic: "${topic}"`);

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        temperature: 0.5,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI during analysis');

      const analysis = parseJsonFromAI<AnalysisPayload>(content);

      return {
        strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
        weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
        summary: typeof analysis.summary === 'string' ? analysis.summary : 'Analysis not available.',
        suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
        questionFeedback: Array.isArray(analysis.questionFeedback) ? analysis.questionFeedback : [],
      };
    }, config.quiz.maxRetries);
  }
}
