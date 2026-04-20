import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface ExamAttributes {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at?: Date;
  updated_at?: Date;
}

interface ExamCreationAttributes extends Optional<ExamAttributes, 'id' | 'description' | 'is_active' | 'display_order'> {}

class Exam extends Model<ExamAttributes, ExamCreationAttributes> implements ExamAttributes {
  public id!: number;
  public name!: string;
  public slug!: string;
  public description!: string | null;
  public is_active!: boolean;
  public display_order!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Exam.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
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
    tableName: 'exams',
    timestamps: true,
  },
);

export { Exam, ExamAttributes, ExamCreationAttributes };
