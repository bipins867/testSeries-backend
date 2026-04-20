import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface QuizSessionQuestionAttributes {
  id: number;
  session_id: string;
  question_id: string;
  question_order: number;
  created_at?: Date;
}

interface QuizSessionQuestionCreationAttributes extends Optional<QuizSessionQuestionAttributes, 'id'> {}

class QuizSessionQuestion extends Model<QuizSessionQuestionAttributes, QuizSessionQuestionCreationAttributes> implements QuizSessionQuestionAttributes {
  public id!: number;
  public session_id!: string;
  public question_id!: string;
  public question_order!: number;
  public readonly created_at!: Date;
}

QuizSessionQuestion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    question_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    question_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'quiz_session_questions',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['session_id', 'question_id'],
      },
    ],
  },
);

export { QuizSessionQuestion, QuizSessionQuestionAttributes, QuizSessionQuestionCreationAttributes };
