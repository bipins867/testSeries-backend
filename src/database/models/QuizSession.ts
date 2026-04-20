import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface QuizSessionAttributes {
  id: string;
  user_id: string;
  exam_id: number | null;
  subject_id: number | null;
  topic_id: number | null;
  topic_text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  mode: 'practice' | 'test';
  question_count: number;
  status: 'active' | 'submitted' | 'expired' | 'abandoned';
  questions_from_db: number;
  questions_from_ai: number;
  started_at: Date;
  submitted_at: Date | null;
  time_limit_seconds: number | null;
  created_at?: Date;
  updated_at?: Date;
}

interface QuizSessionCreationAttributes extends Optional<QuizSessionAttributes, 'id' | 'exam_id' | 'subject_id' | 'topic_id' | 'mode' | 'status' | 'questions_from_db' | 'questions_from_ai' | 'submitted_at' | 'time_limit_seconds'> {}

class QuizSession extends Model<QuizSessionAttributes, QuizSessionCreationAttributes> implements QuizSessionAttributes {
  public id!: string;
  public user_id!: string;
  public exam_id!: number | null;
  public subject_id!: number | null;
  public topic_id!: number | null;
  public topic_text!: string;
  public difficulty!: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  public mode!: 'practice' | 'test';
  public question_count!: number;
  public status!: 'active' | 'submitted' | 'expired' | 'abandoned';
  public questions_from_db!: number;
  public questions_from_ai!: number;
  public started_at!: Date;
  public submitted_at!: Date | null;
  public time_limit_seconds!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

QuizSession.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    exam_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    subject_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    topic_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    topic_text: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.ENUM('Easy', 'Medium', 'Hard', 'Mixed'),
      allowNull: false,
      defaultValue: 'Mixed',
    },
    mode: {
      type: DataTypes.ENUM('practice', 'test'),
      allowNull: false,
      defaultValue: 'practice',
    },
    question_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'submitted', 'expired', 'abandoned'),
      allowNull: false,
      defaultValue: 'active',
    },
    questions_from_db: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    questions_from_ai: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    time_limit_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'quiz_sessions',
    timestamps: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['topic_id'] },
    ],
  },
);

export { QuizSession, QuizSessionAttributes, QuizSessionCreationAttributes };
