import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface UserAnswerAttributes {
  id: number;
  session_id: string;
  question_id: string;
  session_question_id: number;
  selected_option_index: number | null;
  is_correct: boolean;
  time_spent_seconds: number | null;
  answered_at: Date | null;
}

interface UserAnswerCreationAttributes extends Optional<UserAnswerAttributes, 'id' | 'selected_option_index' | 'time_spent_seconds' | 'answered_at'> {}

class UserAnswer extends Model<UserAnswerAttributes, UserAnswerCreationAttributes> implements UserAnswerAttributes {
  public id!: number;
  public session_id!: string;
  public question_id!: string;
  public session_question_id!: number;
  public selected_option_index!: number | null;
  public is_correct!: boolean;
  public time_spent_seconds!: number | null;
  public answered_at!: Date | null;
}

UserAnswer.init(
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
    session_question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    selected_option_index: {
      type: DataTypes.TINYINT,
      allowNull: true, // null = skipped
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    time_spent_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    answered_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'user_answers',
    timestamps: false,
    indexes: [
      { fields: ['session_id'] },
      { fields: ['question_id'] },
    ],
  },
);

export { UserAnswer, UserAnswerAttributes, UserAnswerCreationAttributes };
