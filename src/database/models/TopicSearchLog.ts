import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface TopicSearchLogAttributes {
  id: number;
  user_id: string | null;
  topic_text: string;
  normalized_topic: string;
  exam_id: number | null;
  difficulty: string | null;
  requested_count: number | null;
  served_from_db: number;
  served_from_ai: number;
  created_at?: Date;
}

interface TopicSearchLogCreationAttributes extends Optional<TopicSearchLogAttributes, 'id' | 'user_id' | 'exam_id' | 'difficulty' | 'requested_count' | 'served_from_db' | 'served_from_ai'> {}

class TopicSearchLog extends Model<TopicSearchLogAttributes, TopicSearchLogCreationAttributes> implements TopicSearchLogAttributes {
  public id!: number;
  public user_id!: string | null;
  public topic_text!: string;
  public normalized_topic!: string;
  public exam_id!: number | null;
  public difficulty!: string | null;
  public requested_count!: number | null;
  public served_from_db!: number;
  public served_from_ai!: number;
  public readonly created_at!: Date;
}

TopicSearchLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: { type: DataTypes.UUID, allowNull: true },
    topic_text: { type: DataTypes.STRING(255), allowNull: false },
    normalized_topic: { type: DataTypes.STRING(255), allowNull: false },
    exam_id: { type: DataTypes.INTEGER, allowNull: true },
    difficulty: { type: DataTypes.STRING(20), allowNull: true },
    requested_count: { type: DataTypes.INTEGER, allowNull: true },
    served_from_db: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    served_from_ai: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: 'topic_search_logs',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['normalized_topic'] },
      { fields: ['created_at'] },
    ],
  },
);

export { TopicSearchLog, TopicSearchLogAttributes, TopicSearchLogCreationAttributes };
