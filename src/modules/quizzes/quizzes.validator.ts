import { z } from 'zod';

export const createQuizSchema = z.object({
  topic: z.string().min(2, 'Topic must be at least 2 characters').max(200),
  numberOfQuestions: z.number().int().min(1).max(20).default(5),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Mixed']).default('Mixed'),
  mode: z.enum(['practice', 'test']).default('practice'),
  examId: z.number().int().optional(),
  subjectId: z.number().int().optional(),
});

export const submitQuizSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selected: z.string().min(1),
      timeSpent: z.number().optional(),
    }),
  ).min(1, 'Must submit at least 1 answer'),
});
