import { User, Role } from '../../database/models';

export class AuthRepository {
  async findUserByEmail(email: string, includePassword = false) {
    const scope = includePassword ? 'withPassword' : undefined;
    const query = scope ? User.scope(scope) : User;
    return query.findOne({
      where: { email },
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
    });
  }

  async findUserById(id: string) {
    return User.findByPk(id, {
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
    });
  }

  async findUserByIdWithPassword(id: string) {
    return User.scope('withPassword').findByPk(id, {
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
    });
  }

  async findUserByIdWithRefreshToken(id: string) {
    return User.scope('full').findByPk(id);
  }

  async createUser(data: {
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    role_id: number;
  }) {
    return User.create(data);
  }

  async updateUser(id: string, data: Partial<{
    first_name: string;
    last_name: string;
    password_hash: string;
    refresh_token: string | null;
    last_login_at: Date;
    is_active: boolean;
  }>) {
    await User.update(data, { where: { id } });
    return this.findUserById(id);
  }

  async findRoleByName(name: string) {
    return Role.findOne({ where: { name } });
  }
}
