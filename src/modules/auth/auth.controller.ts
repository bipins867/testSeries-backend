import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../common/responses/ApiResponse';
import { AuthenticatedRequest } from '../../common/middleware/authenticate';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      return ApiResponse.created(res, result, 'Registration successful');
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return ApiResponse.success(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;
      const tokens = await authService.refreshToken(refresh_token);
      return ApiResponse.success(res, tokens, 'Token refreshed successfully');
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      await authService.logout(userId);
      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const user = await authService.getProfile(userId);
      return ApiResponse.success(res, user);
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const user = await authService.updateProfile(userId, req.body);
      return ApiResponse.success(res, user, 'Profile updated');
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { current_password, new_password } = req.body;
      await authService.changePassword(userId, current_password, new_password);
      return ApiResponse.success(res, null, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /auth/forgot-password
   * Sends a dummy OTP (1234) — simulates email delivery
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      return ApiResponse.success(res, null, 'OTP sent to your email address');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /auth/reset-password
   * Verifies OTP and resets the password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, new_password } = req.body;
      await authService.resetPassword(email, otp, new_password);
      return ApiResponse.success(res, null, 'Password reset successful');
    } catch (err) {
      next(err);
    }
  }
}
