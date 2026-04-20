import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface AiGenerationLogAttributes {
  id: number;
  topic_id: number | null;
  topic_text: string;
  difficulty: string;
  requested_count: number;
  generated_count: number;
  valid_count: number;
  stored_count: number;
  model: string;
  prompt_version: string | null;
  total_tokens_used: number | null;
  generation_time_ms: number | null;
  error_message: string | null;
  triggered_by: string | null;
  created_at?: Date;
}

interface AiGenerationLogCreationAttributes extends Optional<AiGenerationLogAttributes, 'id' | 'topic_id' | 'prompt_version' | 'total_tokens_used' | 'generation_time_ms' | 'error_message' | 'triggered_by'> {}

class AiGenerationLog extends Model<AiGenerationLogAttributes, AiGenerationLogCreationAttributes> implements AiGenerationLogAttributes {
  public id!: number;
  public topic_id!: number | null;
  public topic_text!: string;
  public difficulty!: string;
  public requested_count!: number;
  public generated_count!: number;
  public valid_count!: number;
  public stored_count!: number;
  public model!: string;
  public prompt_version!: string | null;
  public total_tokens_used!: number | null;
  public generation_time_ms!: number | null;
  public error_message!: string | null;
  public triggered_by!: string | null;
  public readonly created_at!: Date;
}

AiGenerationLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    topic_id: { type: DataTypes.INTEGER, allowNull: true },
    topic_text: { type: DataTypes.STRING(255), allowNull: false },
    difficulty: { type: DataTypes.STRING(20), allowNull: false },
    requested_count: { type: DataTypes.INTEGER, allowNull: false },
    generated_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    valid_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    stored_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    model: { type: DataTypes.STRING(100), allowNull: false },
    prompt_version: { type: DataTypes.STRING(50), allowNull: true },
    total_tokens_used: { type: DataTypes.INTEGER, allowNull: true },
    generation_time_ms: { type: DataTypes.INTEGER, allowNull: true },
    error_message: { type: DataTypes.TEXT, allowNull: true },
    triggered_by: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    tableName: 'ai_generation_logs',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['topic_id'] },
      { fields: ['created_at'] },
    ],
  },
);

export { AiGenerationLog, AiGenerationLogAttributes, AiGenerationLogCreationAttributes };
