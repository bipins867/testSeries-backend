import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface QuizResultAttributes {
  id: string;
  session_id: string;
  user_id: string;
  total_questions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  skipped: number;
  score: number;
  accuracy: number;
  total_time_seconds: number | null;
  ai_analysis: Record<string, unknown> | null;
  topic_wise_breakdown: Record<string, unknown> | null;
  difficulty_wise_breakdown: Record<string, unknown> | null;
  created_at?: Date;
}

interface QuizResultCreationAttributes extends Optional<QuizResultAttributes, 'id' | 'total_time_seconds' | 'ai_analysis' | 'topic_wise_breakdown' | 'difficulty_wise_breakdown'> {}

class QuizResult extends Model<QuizResultAttributes, QuizResultCreationAttributes> implements QuizResultAttributes {
  public id!: string;
  public session_id!: string;
  public user_id!: string;
  public total_questions!: number;
  public attempted!: number;
  public correct!: number;
  public incorrect!: number;
  public skipped!: number;
  public score!: number;
  public accuracy!: number;
  public total_time_seconds!: number | null;
  public ai_analysis!: Record<string, unknown> | null;
  public topic_wise_breakdown!: Record<string, unknown> | null;
  public difficulty_wise_breakdown!: Record<string, unknown> | null;
  public readonly created_at!: Date;
}

QuizResult.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    total_questions: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    attempted: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    correct: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    incorrect: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    skipped: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    accuracy: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    total_time_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ai_analysis: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    topic_wise_breakdown: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    difficulty_wise_breakdown: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'quiz_results',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
    ],
  },
);

export { QuizResult, QuizResultAttributes, QuizResultCreationAttributes };
