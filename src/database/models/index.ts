/**
 * Model registry — imports all models and defines associations.
 * Import this file once at app startup to register everything with Sequelize.
 */
import { Role } from './Role';
import { User } from './User';
import { Exam } from './Exam';
import { Subject } from './Subject';
import { Topic } from './Topic';
import { Question } from './Question';
import { QuestionOption } from './QuestionOption';
import { QuizSession } from './QuizSession';
import { QuizSessionQuestion } from './QuizSessionQuestion';
import { UserAnswer } from './UserAnswer';
import { QuizResult } from './QuizResult';
import { Bookmark } from './Bookmark';
import { AiGenerationLog } from './AiGenerationLog';
import { TopicSearchLog } from './TopicSearchLog';
import { AdminAuditLog } from './AdminAuditLog';

// ─── Associations ──────────────────────────────────────────

// Role ↔ User
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// Exam ↔ Subject
Exam.hasMany(Subject, { foreignKey: 'exam_id', as: 'subjects' });
Subject.belongsTo(Exam, { foreignKey: 'exam_id', as: 'exam' });

// Subject ↔ Topic
Subject.hasMany(Topic, { foreignKey: 'subject_id', as: 'topics' });
Topic.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

// Topic ↔ Question
Topic.hasMany(Question, { foreignKey: 'topic_id', as: 'questions' });
Question.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });

// Question ↔ QuestionOption
Question.hasMany(QuestionOption, { foreignKey: 'question_id', as: 'options' });
QuestionOption.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

// User ↔ QuizSession
User.hasMany(QuizSession, { foreignKey: 'user_id', as: 'quizSessions' });
QuizSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// QuizSession ↔ Exam/Subject/Topic (optional FK for catalog tracking)
QuizSession.belongsTo(Exam, { foreignKey: 'exam_id', as: 'exam' });
QuizSession.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });
QuizSession.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });

// QuizSession ↔ QuizSessionQuestion ↔ Question
QuizSession.hasMany(QuizSessionQuestion, { foreignKey: 'session_id', as: 'sessionQuestions' });
QuizSessionQuestion.belongsTo(QuizSession, { foreignKey: 'session_id', as: 'session' });
QuizSessionQuestion.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });
Question.hasMany(QuizSessionQuestion, { foreignKey: 'question_id', as: 'sessionQuestions' });

// QuizSession ↔ UserAnswer
QuizSession.hasMany(UserAnswer, { foreignKey: 'session_id', as: 'answers' });
UserAnswer.belongsTo(QuizSession, { foreignKey: 'session_id', as: 'session' });
UserAnswer.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });
UserAnswer.belongsTo(QuizSessionQuestion, { foreignKey: 'session_question_id', as: 'sessionQuestion' });

// QuizSession ↔ QuizResult (1:1)
QuizSession.hasOne(QuizResult, { foreignKey: 'session_id', as: 'result' });
QuizResult.belongsTo(QuizSession, { foreignKey: 'session_id', as: 'session' });
QuizResult.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ Bookmark ↔ Question
User.hasMany(Bookmark, { foreignKey: 'user_id', as: 'bookmarks' });
Bookmark.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Bookmark.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });
Question.hasMany(Bookmark, { foreignKey: 'question_id', as: 'bookmarks' });

// AI / Logging (loose FK)
AiGenerationLog.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });
TopicSearchLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
AdminAuditLog.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });

// ─── Exports ──────────────────────────────────────────

export {
  Role,
  User,
  Exam,
  Subject,
  Topic,
  Question,
  QuestionOption,
  QuizSession,
  QuizSessionQuestion,
  UserAnswer,
  QuizResult,
  Bookmark,
  AiGenerationLog,
  TopicSearchLog,
  AdminAuditLog,
};
