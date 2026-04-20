import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../common/config';
import { ConflictError, UnauthorizedError, BadRequestError, NotFoundError } from '../../common/errors';
import { ROLES } from '../../common/constants';
import { AuthRepository } from './auth.repository';
import { JwtPayload } from '../../common/middleware/authenticate';

const authRepository = new AuthRepository();

export class AuthService {
  /**
   * Register a new user with the 'user' role.
   */
  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) {
    // Check if user already exists
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    // Find the user role
    const userRole = await authRepository.findRoleByName(ROLES.USER);
    if (!userRole) {
      throw new Error('Default user role not found. Run seeders first.');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await authRepository.createUser({
      email: data.email,
      password_hash: passwordHash,
      first_name: data.first_name,
      last_name: data.last_name,
      role_id: userRole.id,
    });

    // Fetch with role association
    const fullUser = await authRepository.findUserById(user.id);

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: ROLES.USER,
    });

    // Store refresh token
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await authRepository.updateUser(user.id, { refresh_token: hashedRefreshToken });

    return {
      user: this.sanitizeUser(fullUser!),
      ...tokens,
    };
  }

  /**
   * Login with email and password.
   */
  async login(email: string, password: string) {
    // Find user with password
    const user = await authRepository.findUserByEmail(email, true);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const roleName = user.role?.name || ROLES.USER;

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: roleName,
    });

    // Store refresh token and update last login
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await authRepository.updateUser(user.id, {
      refresh_token: hashedRefreshToken,
      last_login_at: new Date(),
    });

    // Refetch clean user (no password)
    const cleanUser = await authRepository.findUserById(user.id);

    return {
      user: this.sanitizeUser(cleanUser!),
      ...tokens,
    };
  }

  /**
   * Refresh access token using a valid refresh token.
   */
  async refreshToken(refreshTokenInput: string) {
    // Decode the refresh token to get user ID
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(refreshTokenInput, config.jwt.refreshSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Find user with stored refresh token
    const user = await authRepository.findUserByIdWithRefreshToken(decoded.userId);
    if (!user || !user.refresh_token) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Verify the stored token matches
    const isMatch = await bcrypt.compare(refreshTokenInput, user.refresh_token);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Fetch fresh role info
    const fullUser = await authRepository.findUserById(user.id);
    const roleName = fullUser?.role?.name || ROLES.USER;

    // Generate new token pair
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: roleName,
    });

    // Store new refresh token
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await authRepository.updateUser(user.id, { refresh_token: hashedRefreshToken });

    return tokens;
  }

  /**
   * Logout — invalidate refresh token.
   */
  async logout(userId: string) {
    await authRepository.updateUser(userId, { refresh_token: null });
  }

  /**
   * Get current user profile.
   */
  async getProfile(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.sanitizeUser(user);
  }

  /**
   * Update user profile.
   */
  async updateProfile(userId: string, data: { first_name?: string; last_name?: string }) {
    const updated = await authRepository.updateUser(userId, data);
    if (!updated) {
      throw new NotFoundError('User not found');
    }
    return this.sanitizeUser(updated);
  }

  /**
   * Change password.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await authRepository.findUserByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await authRepository.updateUser(userId, { password_hash: newHash });
  }

  // ─── Private helpers ──────────────────────────────────

  private generateTokens(payload: JwtPayload) {
    const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry as any,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry as any,
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const plain = user.toJSON ? user.toJSON() : user;
    return {
      id: plain.id,
      email: plain.email,
      first_name: plain.first_name,
      last_name: plain.last_name,
      role: plain.role?.name || 'user',
      is_active: plain.is_active,
      last_login_at: plain.last_login_at,
      created_at: plain.created_at,
    };
  }
}
