import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface SubjectAttributes {
  id: number;
  exam_id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at?: Date;
  updated_at?: Date;
}

interface SubjectCreationAttributes extends Optional<SubjectAttributes, 'id' | 'description' | 'is_active' | 'display_order'> {}

class Subject extends Model<SubjectAttributes, SubjectCreationAttributes> implements SubjectAttributes {
  public id!: number;
  public exam_id!: number;
  public name!: string;
  public slug!: string;
  public description!: string | null;
  public is_active!: boolean;
  public display_order!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Subject.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    exam_id: {
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'subjects',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['exam_id', 'slug'],
      },
    ],
  },
);

export { Subject, SubjectAttributes, SubjectCreationAttributes };
