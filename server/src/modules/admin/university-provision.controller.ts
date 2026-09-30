import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { University, User } from '../../models';
import { sendSuccess } from '../../utils/response.util';
import { BadRequestError, ConflictError } from '../../utils/errors.util';
import { hashPassword } from '../../utils/password.util';
import { generateInvitationToken, buildActivationLink } from '../../utils/token.util';
import { logAuditEvent } from '../../utils/audit.util';
import { UserRole } from '../../shared';
import { ENV } from '../../config/environment';

export class UniversityProvisionController {
  /**
   * Super Admin onboards a new institution: creates the University record
   * and its first University Admin (or Leadership) account in one call,
   * returning an activation link since the platform has no email service
   * wired up yet — the caller is expected to hand-deliver it.
   */
  async provisionUniversity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { university, admin } = req.body;

      if (!university?.nameEn || !university?.nameAr || !university?.code || !university?.city) {
        throw new BadRequestError('university.nameEn, nameAr, code, and city are required');
      }
      if (!admin?.email || !admin?.firstNameEn || !admin?.lastNameEn) {
        throw new BadRequestError('admin.email, firstNameEn, and lastNameEn are required');
      }

      const adminRole: UserRole =
        admin.role === UserRole.UNIVERSITY_LEADERSHIP ? UserRole.UNIVERSITY_LEADERSHIP : UserRole.UNIVERSITY_ADMIN;

      const normalizedEmail = String(admin.email).toLowerCase().trim();
      const normalizedCode = String(university.code).toUpperCase().trim();

      const [existingUniversity, existingUser] = await Promise.all([
        University.findOne({ code: normalizedCode }),
        User.findOne({ email: normalizedEmail }),
      ]);
      if (existingUniversity) throw new ConflictError(`A university with code "${normalizedCode}" already exists`);
      if (existingUser) throw new ConflictError(`A user with email "${normalizedEmail}" already exists`);

      const createdUniversity = await University.create({
        nameEn: university.nameEn,
        nameAr: university.nameAr,
        code: normalizedCode,
        city: university.city,
        country: university.country,
        domain: university.domain,
        contactEmail: university.contactEmail || normalizedEmail,
        website: university.website,
        logoUrl: university.logoUrl,
        isActive: true,
      });

      const { rawToken, hashedToken, expiresAt } = generateInvitationToken();
      // Placeholder credential — unusable (random, never disclosed) and
      // irrelevant anyway since login is gated on isActive=false until the
      // invitee sets their own password via /auth/activate.
      const placeholderPasswordHash = await hashPassword(crypto.randomBytes(24).toString('hex'));

      const createdAdmin = await User.create({
        email: normalizedEmail,
        passwordHash: placeholderPasswordHash,
        firstNameEn: admin.firstNameEn,
        lastNameEn: admin.lastNameEn,
        firstNameAr: admin.firstNameAr,
        lastNameAr: admin.lastNameAr,
        phone: admin.phone,
        role: adminRole,
        universityId: createdUniversity._id,
        isActive: false,
        isActivated: false,
        invitationToken: hashedToken,
        invitationExpires: expiresAt,
      });

      await logAuditEvent({
        actorId: req.user!.userId,
        actorName: req.user!.email,
        actorRole: req.user!.role,
        action: 'PROVISION_UNIVERSITY',
        entity: 'University',
        entityId: createdUniversity._id.toString(),
        newStatus: 'CREATED',
        details: { adminUserId: createdAdmin._id.toString(), adminRole },
        ipAddress: req.ip,
      });

      sendSuccess(
        res,
        {
          university: createdUniversity,
          admin: {
            id: createdAdmin._id,
            email: createdAdmin.email,
            role: createdAdmin.role,
          },
          activationLink: buildActivationLink(ENV.CLIENT_URL, rawToken),
          activationExpiresAt: expiresAt,
        },
        'University and primary admin account provisioned successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async getUniversities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const universities = await University.find().sort({ createdAt: -1 }).lean();
      sendSuccess(res, universities);
    } catch (error) {
      next(error);
    }
  }
}

export const universityProvisionController = new UniversityProvisionController();
