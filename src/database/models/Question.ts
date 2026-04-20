import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface QuestionAttributes {
  id: string;
  topic_id: number;
  question_text: string;
  question_hash: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  explanation: string | null;
  correct_option_index: number;
  source_type: 'ai_generated' | 'manual' | 'imported';
  ai_model: string | null;
  ai_prompt_version: string | null;
  confidence_score: number | null;
  review_status: 'pending' | 'approved' | 'rejected' | 'draft';
  is_active: boolean;
  language: string;
  tags: string[] | null;
  times_served: number;
  last_served_at: Date | null;
  success_rate: number | null;
  total_attempts: number;
  created_by: string | null;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

interface QuestionCreationAttributes extends Optional<QuestionAttributes, 'id' | 'explanation' | 'ai_model' | 'ai_prompt_version' | 'confidence_score' | 'review_status' | 'is_active' | 'language' | 'tags' | 'times_served' | 'last_served_at' | 'success_rate' | 'total_attempts' | 'created_by' | 'reviewed_by' | 'reviewed_at'> {}

class Question extends Model<QuestionAttributes, QuestionCreationAttributes> implements QuestionAttributes {
  public id!: string;
  public topic_id!: number;
  public question_text!: string;
  public question_hash!: string;
  public difficulty!: 'Easy' | 'Medium' | 'Hard';
  public explanation!: string | null;
  public correct_option_index!: number;
  public source_type!: 'ai_generated' | 'manual' | 'imported';
  public ai_model!: string | null;
  public ai_prompt_version!: string | null;
  public confidence_score!: number | null;
  public review_status!: 'pending' | 'approved' | 'rejected' | 'draft';
  public is_active!: boolean;
  public language!: string;
  public tags!: string[] | null;
  public times_served!: number;
  public last_served_at!: Date | null;
  public success_rate!: number | null;
  public total_attempts!: number;
  public created_by!: string | null;
  public reviewed_by!: string | null;
  public reviewed_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association helpers
  public options?: any[];
}

Question.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    topic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    question_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    difficulty: {
      type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
      allowNull: false,
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    correct_option_index: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: { min: 0, max: 3 },
    },
    source_type: {
      type: DataTypes.ENUM('ai_generated', 'manual', 'imported'),
      allowNull: false,
      defaultValue: 'ai_generated',
    },
    ai_model: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    ai_prompt_version: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    confidence_score: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
    },
    review_status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'draft'),
      allowNull: false,
      defaultValue: 'pending',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    language: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'en',
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    times_served: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    last_served_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    success_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    total_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    reviewed_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'questions',
    timestamps: true,
    indexes: [
      {
        fields: ['topic_id', 'difficulty', 'is_active', 'review_status'],
      },
      {
        fields: ['times_served', 'last_served_at'],
      },
      {
        fields: ['review_status'],
      },
      {
        fields: ['source_type'],
      },
    ],
  },
);

export { Question, QuestionAttributes, QuestionCreationAttributes };
