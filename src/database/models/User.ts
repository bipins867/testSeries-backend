import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface UserAttributes {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role_id: number;
  is_active: boolean;
  last_login_at: Date | null;
  refresh_token: string | null;
  password_reset_token: string | null;
  password_reset_expires: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'is_active' | 'last_login_at' | 'refresh_token' | 'password_reset_token' | 'password_reset_expires'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password_hash!: string;
  public first_name!: string;
  public last_name!: string;
  public role_id!: number;
  public is_active!: boolean;
  public last_login_at!: Date | null;
  public refresh_token!: string | null;
  public password_reset_token!: string | null;
  public password_reset_expires!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations populated via include
  public role?: any;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    password_reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ['password_hash', 'refresh_token', 'password_reset_token', 'password_reset_expires'] },
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password_hash'] },
      },
      withRefreshToken: {
        attributes: { include: ['refresh_token'] },
      },
      full: {
        attributes: undefined as any,
      },
    },
  },
);

export { User, UserAttributes, UserCreationAttributes };
