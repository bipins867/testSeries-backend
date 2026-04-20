import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface TopicAttributes {
  id: number;
  subject_id: number;
  name: string;
  slug: string;
  normalized_name: string;
  description: string | null;
  is_active: boolean;
  question_count: number;
  display_order: number;
  created_at?: Date;
  updated_at?: Date;
}

interface TopicCreationAttributes extends Optional<TopicAttributes, 'id' | 'description' | 'is_active' | 'question_count' | 'display_order'> {}

class Topic extends Model<TopicAttributes, TopicCreationAttributes> implements TopicAttributes {
  public id!: number;
  public subject_id!: number;
  public name!: string;
  public slug!: string;
  public normalized_name!: string;
  public description!: string | null;
  public is_active!: boolean;
  public question_count!: number;
  public display_order!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Topic.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    subject_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    normalized_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    question_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'topics',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['subject_id', 'slug'],
      },
      {
        fields: ['normalized_name'],
      },
    ],
  },
);

export { Topic, TopicAttributes, TopicCreationAttributes };
