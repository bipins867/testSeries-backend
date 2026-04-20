export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const QUESTION_DIFFICULTY = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
} as const;

export type QuestionDifficulty = (typeof QUESTION_DIFFICULTY)[keyof typeof QUESTION_DIFFICULTY];

export const QUIZ_DIFFICULTY = {
  ...QUESTION_DIFFICULTY,
  MIXED: 'Mixed',
} as const;

export type QuizDifficulty = (typeof QUIZ_DIFFICULTY)[keyof typeof QUIZ_DIFFICULTY];

export const QUIZ_MODE = {
  PRACTICE: 'practice',
  TEST: 'test',
} as const;

export type QuizMode = (typeof QUIZ_MODE)[keyof typeof QUIZ_MODE];

export const QUIZ_STATUS = {
  ACTIVE: 'active',
  SUBMITTED: 'submitted',
  EXPIRED: 'expired',
  ABANDONED: 'abandoned',
} as const;

export const QUESTION_SOURCE_TYPE = {
  AI_GENERATED: 'ai_generated',
  MANUAL: 'manual',
  IMPORTED: 'imported',
} as const;

export const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DRAFT: 'draft',
} as const;

export type ReviewStatus = (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];
