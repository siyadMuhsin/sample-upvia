import mongoose from 'mongoose';
import { RuleBasedMatchingProvider } from '../modules/matching/matching.service';
import { OpportunityType, WorkMode, StudentStatus } from '../shared';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Course, Department, College, University } from '../models';

describe('Upvia Explainable Deterministic Matching Engine', () => {
  const provider = new RuleBasedMatchingProvider();
  const dockerSkillId = new mongoose.Types.ObjectId('600000000000000000000003');

  beforeAll(async () => {
    await connectDatabase();

    // The matching engine now queries the real Course catalog for its
    // recommended-course bridge, so seed one real course teaching "Docker".
    const university = await University.create({
      nameEn: 'Matching Test University',
      nameAr: 'جامعة الاختبار',
      code: 'MTU',
      city: 'Riyadh',
      country: 'Saudi Arabia',
    });
    const college = await College.create({ universityId: university._id, nameEn: 'Computing', nameAr: 'الحوسبة', code: 'COMP' });
    const department = await Department.create({ collegeId: college._id, nameEn: 'Software Engineering', nameAr: 'هندسة البرمجيات', code: 'SWE' });
    await Course.create({
      courseCode: 'CS301',
      nameEn: 'Container Orchestration',
      nameAr: 'تنسيق الحاويات',
      departmentId: department._id,
      skills: [{ skillId: dockerSkillId, skillNameEn: 'Docker', levelTaught: 3 }],
    });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should accurately calculate match score and return explainable breakdown', async () => {
    const mockStudent: any = {
      _id: new mongoose.Types.ObjectId(),
      specialization: 'Software Engineering',
      gpa: 3.8,
      maxGpa: 4.0,
      creditsCompleted: 100,
      skills: [
        { skillId: new mongoose.Types.ObjectId('600000000000000000000001'), skillNameEn: 'TypeScript', level: 4, verified: true },
        { skillId: new mongoose.Types.ObjectId('600000000000000000000002'), skillNameEn: 'React', level: 3, verified: true },
      ],
      projects: [{ title: 'Project 1', technologies: ['React', 'TypeScript'] }],
      certificates: [{ title: 'AWS Cloud' }],
      activities: [{ role: 'Club Lead' }],
    };

    const mockOpportunity: any = {
      _id: new mongoose.Types.ObjectId(),
      titleEn: 'Software Engineering Co-op',
      requiredSpecializations: ['Software Engineering'],
      requiredSkills: [
        { skillId: new mongoose.Types.ObjectId('600000000000000000000001'), skillNameEn: 'TypeScript', minimumLevel: 3 },
        { skillId: new mongoose.Types.ObjectId('600000000000000000000002'), skillNameEn: 'React', minimumLevel: 3 },
        { skillId: new mongoose.Types.ObjectId('600000000000000000000003'), skillNameEn: 'Docker', minimumLevel: 2 },
      ],
      minimumGPA: 3.0,
      experienceYears: 0,
      workMode: WorkMode.HYBRID,
    };

    const result = await provider.calculateMatch(mockStudent, mockOpportunity);

    expect(result.score).toBeGreaterThan(70);
    expect(result.breakdown.specializationScore).toBe(100);
    expect(result.matchedSkills.length).toBe(2);
    expect(result.missingSkills.length).toBe(1);
    expect(result.missingSkills[0].name).toBe('Docker');
    expect(result.recommendedCourses.length).toBe(1);
    expect(result.recommendedCourses[0].targetSkill).toBe('Docker');
    expect(result.eligibility.eligible).toBe(true);
    expect(result.explanation).toContain('match');
  });

  it('should flag ineligibility when student GPA is lower than required', async () => {
    const mockStudent: any = {
      _id: new mongoose.Types.ObjectId(),
      specialization: 'Civil Engineering',
      gpa: 2.2,
      maxGpa: 4.0,
      creditsCompleted: 40,
      skills: [],
      projects: [],
      certificates: [],
      activities: [],
    };

    const mockOpportunity: any = {
      _id: new mongoose.Types.ObjectId(),
      titleEn: 'Senior AI Engineer',
      requiredSpecializations: ['Computer Science'],
      requiredSkills: [
        { skillId: new mongoose.Types.ObjectId(), skillNameEn: 'Machine Learning', minimumLevel: 4 },
      ],
      minimumGPA: 3.5,
      experienceYears: 2,
      workMode: WorkMode.ON_SITE,
    };

    const result = await provider.calculateMatch(mockStudent, mockOpportunity);

    expect(result.eligibility.eligible).toBe(false);
    expect(result.eligibility.reasons.length).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(40);
  });
});
