import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface BookmarkAttributes {
  id: number;
  user_id: string;
  question_id: string;
  note: string | null;
  created_at?: Date;
}

interface BookmarkCreationAttributes extends Optional<BookmarkAttributes, 'id' | 'note'> {}

class Bookmark extends Model<BookmarkAttributes, BookmarkCreationAttributes> implements BookmarkAttributes {
  public id!: number;
  public user_id!: string;
  public question_id!: string;
  public note!: string | null;
  public readonly created_at!: Date;
}

Bookmark.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    question_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'bookmarks',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'question_id'],
      },
    ],
  },
);

export { Bookmark, BookmarkAttributes, BookmarkCreationAttributes };
