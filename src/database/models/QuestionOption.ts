import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface QuestionOptionAttributes {
  id: number;
  question_id: string;
  option_index: number;
  option_text: string;
  created_at?: Date;
}

interface QuestionOptionCreationAttributes extends Optional<QuestionOptionAttributes, 'id'> {}

class QuestionOption extends Model<QuestionOptionAttributes, QuestionOptionCreationAttributes> implements QuestionOptionAttributes {
  public id!: number;
  public question_id!: string;
  public option_index!: number;
  public option_text!: string;
  public readonly created_at!: Date;
}

QuestionOption.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    question_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    option_index: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: { min: 0, max: 3 },
    },
    option_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'question_options',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['question_id', 'option_index'],
      },
    ],
  },
);

export { QuestionOption, QuestionOptionAttributes, QuestionOptionCreationAttributes };
