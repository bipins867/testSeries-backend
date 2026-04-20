import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface RoleAttributes {
  id: number;
  name: string;
  description: string | null;
  created_at?: Date;
}

interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'description'> {}

class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public readonly created_at!: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'roles',
    timestamps: true,
    updatedAt: false,
  },
);

export { Role, RoleAttributes, RoleCreationAttributes };
