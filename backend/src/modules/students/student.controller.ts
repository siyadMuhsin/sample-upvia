import { Request, Response, NextFunction } from 'express';
import { Student } from '../../models';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import { NotFoundError, BadRequestError } from '../../utils/errors.util';

export class StudentController {
  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const student = await Student.findOne({ userId: req.user.userId })
        .populate('userId', 'email firstNameEn lastNameEn firstNameAr lastNameAr phone avatarUrl')
        .populate('universityId', 'nameEn nameAr code')
        .populate('collegeId', 'nameEn nameAr code')
        .populate('departmentId', 'nameEn nameAr code')
        .populate('programId', 'nameEn nameAr code')
        .populate('studyPlanId');

      if (!student) throw new NotFoundError('Student profile not found');
      sendSuccess(res, student);
    } catch (error) {
      next(error);
    }
  }

  async updateMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { skills, projects, certificates, languages, activities, cvUrl, linkedinUrl, githubUrl, portfolioUrl } = req.body;

      const student = await Student.findOne({ userId: req.user.userId });
      if (!student) throw new NotFoundError('Student profile not found');

      if (skills !== undefined) student.skills = skills;
      if (projects !== undefined) student.projects = projects;
      if (certificates !== undefined) student.certificates = certificates;
      if (languages !== undefined) student.languages = languages;
      if (activities !== undefined) student.activities = activities;
      if (cvUrl !== undefined) student.cvUrl = cvUrl;
      if (linkedinUrl !== undefined) student.linkedinUrl = linkedinUrl;
      if (githubUrl !== undefined) student.githubUrl = githubUrl;
      if (portfolioUrl !== undefined) student.portfolioUrl = portfolioUrl;

      // Recalculate profile completion score
      let score = 50; // Base academic data from SIS
      if (student.skills && student.skills.length > 0) score += 15;
      if (student.projects && student.projects.length > 0) score += 15;
      if (student.cvUrl) score += 10;
      if (student.certificates && student.certificates.length > 0) score += 5;
      if (student.linkedinUrl || student.githubUrl) score += 5;
      student.profileCompletionScore = Math.min(score, 100);

      await student.save();
      sendSuccess(res, student, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const search = req.query.search as string;
      const programId = req.query.programId as string;
      const studentStatus = req.query.studentStatus as string;

      const filter: any = {};
      if (programId) filter.programId = programId;
      if (studentStatus) filter.studentStatus = studentStatus;
      if (search) {
        filter.$or = [
          { studentId: { $regex: search, $options: 'i' } },
          { specialization: { $regex: search, $options: 'i' } },
        ];
      }

      const total = await Student.countDocuments(filter);
      const students = await Student.find(filter)
        .populate('userId', 'firstNameEn lastNameEn email avatarUrl phone')
        .populate('programId', 'nameEn code')
        .populate('collegeId', 'nameEn code')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      sendPaginated(res, students, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async getStudentById(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await Student.findById(req.params.id)
        .populate('userId', 'firstNameEn lastNameEn firstNameAr lastNameAr email phone avatarUrl')
        .populate('programId', 'nameEn code')
        .populate('collegeId', 'nameEn code')
        .populate('departmentId', 'nameEn code')
        .lean();

      if (!student) throw new NotFoundError('Student not found');
      sendSuccess(res, student);
    } catch (error) {
      next(error);
    }
  }
}

export const studentController = new StudentController();
