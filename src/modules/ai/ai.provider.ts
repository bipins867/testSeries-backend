/**
 * AI Provider interface — abstracts the AI backend.
 * Allows swapping OpenAI for another provider without touching business logic.
 */

export interface GeneratedQuestionPayload {
  question: string;
  options: [string, string, string, string];
  correctAnswer: string; // One of A, B, C, D
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  confidence: number;
}

export interface ValidationResultPayload {
  isValid: boolean;
  correctedAnswer: string;
  issues: string;
}

export interface AnalysisPayload {
  strengths: string[];
  weaknesses: string[];
  summary: string;
  suggestions: string[];
  questionFeedback: { questionId: string; feedback: string }[];
}

export interface AiProvider {
  generateQuestions(topic: string, count: number, difficulty: string): Promise<GeneratedQuestionPayload[]>;
  validateQuestions(questions: GeneratedQuestionPayload[]): Promise<ValidationResultPayload[]>;
  analyzePerformance(
    topic: string,
    questions: any[],
    answers: any[],
    score: number,
    total: number,
  ): Promise<AnalysisPayload>;
}
