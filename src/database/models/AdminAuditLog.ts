import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface AdminAuditLogAttributes {
  id: number;
  admin_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at?: Date;
}

interface AdminAuditLogCreationAttributes extends Optional<AdminAuditLogAttributes, 'id' | 'entity_type' | 'entity_id' | 'old_values' | 'new_values' | 'ip_address'> {}

class AdminAuditLog extends Model<AdminAuditLogAttributes, AdminAuditLogCreationAttributes> implements AdminAuditLogAttributes {
  public id!: number;
  public admin_id!: string;
  public action!: string;
  public entity_type!: string | null;
  public entity_id!: string | null;
  public old_values!: Record<string, unknown> | null;
  public new_values!: Record<string, unknown> | null;
  public ip_address!: string | null;
  public readonly created_at!: Date;
}

AdminAuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    admin_id: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING(100), allowNull: false },
    entity_type: { type: DataTypes.STRING(50), allowNull: true },
    entity_id: { type: DataTypes.STRING(255), allowNull: true },
    old_values: { type: DataTypes.JSON, allowNull: true },
    new_values: { type: DataTypes.JSON, allowNull: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
  },
  {
    sequelize,
    tableName: 'admin_audit_logs',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['admin_id'] },
      { fields: ['action'] },
      { fields: ['created_at'] },
    ],
  },
);

export { AdminAuditLog, AdminAuditLogAttributes, AdminAuditLogCreationAttributes };
