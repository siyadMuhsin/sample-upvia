import { Request, Response, NextFunction } from 'express';
import { User } from '../../models';
import { hashPassword, comparePassword } from '../../utils/password.util';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.util';
import { sendSuccess, sendError } from '../../utils/response.util';
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from '../../utils/errors.util';
import { logAuditEvent } from '../../utils/audit.util';
import { UserRole } from '@upvia/shared';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new BadRequestError('Email and password are required');
      }

      const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedError('Invalid credentials');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('Account is disabled. Please contact administration.');
      }

      const tokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        universityId: user.universityId?.toString(),
        collegeId: user.collegeId?.toString(),
        departmentId: user.departmentId?.toString(),
        programId: user.programId?.toString(),
        companyId: user.companyId?.toString(),
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      user.refreshToken = refreshToken;
      await user.save();

      await logAuditEvent({
        actorId: user._id,
        actorName: `${user.firstNameEn} ${user.lastNameEn}`,
        actorRole: user.role,
        action: 'USER_LOGIN',
        entity: 'User',
        entityId: user._id.toString(),
        ipAddress: req.ip,
      });

      sendSuccess(res, {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          firstNameEn: user.firstNameEn,
          lastNameEn: user.lastNameEn,
          firstNameAr: user.firstNameAr,
          lastNameAr: user.lastNameAr,
          role: user.role,
          universityId: user.universityId,
          collegeId: user.collegeId,
          programId: user.programId,
          companyId: user.companyId,
        },
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new BadRequestError('Refresh token is required');
      }

      const payload = verifyRefreshToken(refreshToken);
      const user = await User.findById(payload.userId).select('+refreshToken');
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const tokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        universityId: user.universityId?.toString(),
        collegeId: user.collegeId?.toString(),
        departmentId: user.departmentId?.toString(),
        programId: user.programId?.toString(),
        companyId: user.companyId?.toString(),
      };

      const newAccessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      user.refreshToken = newRefreshToken;
      await user.save();

      sendSuccess(res, {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      }, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }

      const user = await User.findById(req.user.userId)
        .populate('universityId', 'nameEn nameAr code')
        .populate('collegeId', 'nameEn nameAr code')
        .populate('programId', 'nameEn nameAr code')
        .populate('companyId', 'nameEn nameAr sector logoUrl');

      if (!user) {
        throw new NotFoundError('User not found');
      }

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        await User.findByIdAndUpdate(req.user.userId, { refreshToken: null });
      }
      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
