import { Request, Response, NextFunction } from 'express';
import { User, University } from '../../models';
import { hashPassword, comparePassword } from '../../utils/password.util';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.util';
import { hashToken } from '../../utils/token.util';
import { sendSuccess, sendError } from '../../utils/response.util';
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from '../../utils/errors.util';
import { logAuditEvent } from '../../utils/audit.util';
import { UserRole } from '../../shared';

export const ROLE_DEMO_EMAILS: Record<string, string> = {
  [UserRole.STUDENT]: 'student@upvia.com',
  [UserRole.COMPANY_ADMIN]: 'company.admin@upvia.com',
  [UserRole.COMPANY_RECRUITER]: 'recruiter.elm@upvia.com',
  [UserRole.TRAINING_ENTITY_SUPERVISOR]: 'supervisor.company@upvia.com',
  [UserRole.UNIVERSITY_LEADERSHIP]: 'leadership@upvia.com',
  [UserRole.SUPER_ADMIN]: 'admin@gmail.com',
  [UserRole.COLLEGE_DEAN]: 'dean.computing@upvia.com',
  [UserRole.COLLEGE_VICE_DEAN]: 'vicedean.computing@upvia.com',
  [UserRole.PROGRAM_COORDINATOR]: 'coordinator.se@upvia.com',
  [UserRole.STUDY_PLAN_DIRECTOR]: 'director.plans@upvia.com',
  [UserRole.COOPERATIVE_TRAINING_UNIT]: 'training.unit@upvia.com',
  [UserRole.ALUMNI_EMPLOYMENT_UNIT]: 'alumni.unit@upvia.com',
  [UserRole.ACADEMIC_SUPERVISOR]: 'supervisor.academic@upvia.com',
  [UserRole.REPORT_VIEWER]: 'viewer.reports@upvia.com',
};

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, role } = req.body;
      if (!email || !password) {
        throw new BadRequestError('Email and password are required');
      }

      const normalizedEmail = email.toLowerCase().trim();
      const isAdminMaster =
        normalizedEmail === 'admin@gmail.com' &&
        (password === 'admin@123' || password === 'Password123!');

      let user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

      // If admin@gmail.com requests a specific role, log into that role's demo user
      if (isAdminMaster && role) {
        const demoEmail = ROLE_DEMO_EMAILS[role];
        const roleUser = demoEmail
          ? await User.findOne({ email: demoEmail }).select('+passwordHash')
          : await User.findOne({ role }).select('+passwordHash');
        if (roleUser) {
          user = roleUser;
        }
      }

      // Auto-provision admin@gmail.com if it doesn't exist yet
      if (!user && isAdminMaster) {
        const university = await University.findOne();
        user = await User.create({
          email: 'admin@gmail.com',
          passwordHash: await hashPassword('admin@123'),
          firstNameEn: 'Master',
          lastNameEn: 'Admin',
          firstNameAr: 'المشرف',
          lastNameAr: 'العام',
          role: role || UserRole.SUPER_ADMIN,
          universityId: university?._id,
          isActive: true,
          isEmailVerified: true,
        });
      }

      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Allow match if hashed password matches OR universal sample password admin@123 or Password123!
      const isMatch =
        (await comparePassword(password, user.passwordHash)) ||
        password === 'admin@123' ||
        password === 'Password123!';
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

  /**
   * Accepts an invitation: consumes the (hashed, expiry-checked) activation
   * token issued by university/student provisioning, lets the invitee set
   * their own password, flips the account live, and logs them straight in.
   */
  async activate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        throw new BadRequestError('token and password are required');
      }
      if (typeof password !== 'string' || password.length < 8) {
        throw new BadRequestError('Password must be at least 8 characters long');
      }

      const hashedToken = hashToken(token);
      const user = await User.findOne({
        invitationToken: hashedToken,
        invitationExpires: { $gt: new Date() },
      }).select('+invitationToken');

      if (!user) {
        throw new BadRequestError('This activation link is invalid or has expired');
      }

      user.passwordHash = await hashPassword(password);
      user.isActive = true;
      user.isActivated = true;
      user.invitationToken = undefined;
      user.invitationExpires = undefined;

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
        action: 'ACCOUNT_ACTIVATED',
        entity: 'User',
        entityId: user._id.toString(),
        newStatus: 'ACTIVE',
        ipAddress: req.ip,
      });

      sendSuccess(
        res,
        {
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
        },
        'Account activated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async switchRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role } = req.body;
      if (!role) {
        throw new BadRequestError('Target role is required');
      }

      const currentUser = await User.findById(req.user!.userId);
      if (
        !currentUser ||
        (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.email !== 'admin@gmail.com')
      ) {
        throw new UnauthorizedError('Only administrators can switch roles dynamically');
      }

      const demoEmail = ROLE_DEMO_EMAILS[role];
      let targetUser = demoEmail
        ? await User.findOne({ email: demoEmail })
        : await User.findOne({ role });

      if (!targetUser) {
        targetUser = currentUser;
      }

      const tokenPayload = {
        userId: targetUser._id.toString(),
        email: targetUser.email,
        role: targetUser.role,
        universityId: targetUser.universityId?.toString(),
        collegeId: targetUser.collegeId?.toString(),
        departmentId: targetUser.departmentId?.toString(),
        programId: targetUser.programId?.toString(),
        companyId: targetUser.companyId?.toString(),
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      targetUser.refreshToken = refreshToken;
      await targetUser.save();

      sendSuccess(
        res,
        {
          accessToken,
          refreshToken,
          user: {
            id: targetUser._id,
            email: targetUser.email,
            firstNameEn: targetUser.firstNameEn,
            lastNameEn: targetUser.lastNameEn,
            firstNameAr: targetUser.firstNameAr,
            lastNameAr: targetUser.lastNameAr,
            role: targetUser.role,
            universityId: targetUser.universityId,
            collegeId: targetUser.collegeId,
            programId: targetUser.programId,
            companyId: targetUser.companyId,
          },
        },
        `Switched active role to ${role}`
      );
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
