import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../common/responses/ApiResponse';
import { AuthenticatedRequest } from '../../common/middleware/authenticate';
import { getPagination } from '../../common/utils/pagination';
import { User, Role } from '../../database/models';
import { NotFoundError } from '../../common/errors';
import { Op } from 'sequelize';

export class AdminUsersController {
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { offset, limit, page } = getPagination(req);
      const search = req.query.search as string;
      const roleFilter = req.query.role as string;

      const where: any = {};
      if (search) {
        where[Op.or] = [
          { email: { [Op.like]: `%${search}%` } },
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
        ];
      }

      const include: any[] = [{ model: Role, as: 'role', attributes: ['id', 'name'] }];
      if (roleFilter) {
        include[0].where = { name: roleFilter };
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        include,
        offset,
        limit,
        order: [['created_at', 'DESC']],
      });

      return ApiResponse.paginated(res, rows, count, page, limit);
    } catch (err) { next(err); }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id as string;
      const { role_id, is_active } = req.body;

      const user = await User.findByPk(userId);
      if (!user) throw new NotFoundError('User not found');

      const updateData: any = {};
      if (role_id !== undefined) updateData.role_id = role_id;
      if (is_active !== undefined) updateData.is_active = is_active;

      await User.update(updateData, { where: { id: userId } });
      const updated = await User.findByPk(userId, {
        include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
      });

      return ApiResponse.success(res, updated, 'User updated');
    } catch (err) { next(err); }
  }
}
