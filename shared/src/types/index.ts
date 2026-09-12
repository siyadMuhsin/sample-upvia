import {
  UserRole,
  StudentStatus,
  SkillCategory,
  OpportunityType,
  OpportunityStatus,
  ApplicationStatus,
  InterviewType,
  InterviewStatus,
  TrainingStatus,
  AttendanceStatus,
  TaskStatus,
  JobOfferStatus,
  AlertSeverity,
  WorkMode
} from '../constants';

// Standard API Response Formats
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  errors?: Array<{ field?: string; message: string }>;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

// Core Entity Interfaces
export interface IUser {
  id: string;
  email: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameAr?: string;
  lastNameAr?: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  universityId?: string;
  collegeId?: string;
  departmentId?: string;
  programId?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUniversity {
  id: string;
  nameEn: string;
  nameAr: string;
  code: string;
  logoUrl?: string;
  website?: string;
  city: string;
  country: string;
}

export interface ICollege {
  id: string;
  universityId: string;
  nameEn: string;
  nameAr: string;
  code: string;
  deanName?: string;
}

export interface IDepartment {
  id: string;
  collegeId: string;
  nameEn: string;
  nameAr: string;
  code: string;
}

export interface IProgram {
  id: string;
  departmentId: string;
  collegeId: string;
  nameEn: string;
  nameAr: string;
  code: string;
  degreeLevel: 'BACHELOR' | 'MASTER' | 'PHD' | 'DIPLOMA';
  targetEmploymentRate: number;
  currentEmploymentRate?: number;
  totalCredits: number;
}

export interface ICourse {
  id: string;
  courseCode: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  credits: number;
  semester: number;
  required: boolean;
  prerequisites: string[];
  skills: Array<{
    skillId: string;
    skillNameEn: string;
    levelTaught: number;
  }>;
}

export interface IStudyPlan {
  id: string;
  programId: string;
  version: string;
  year: number;
  isPublished: boolean;
  totalCredits: number;
  courses: Array<{
    courseId: string;
    semester: number;
    isRequired: boolean;
  }>;
  learningOutcomes: string[];
}

export interface ISkill {
  id: string;
  nameEn: string;
  nameAr: string;
  category: SkillCategory;
  description?: string;
  levels?: {
    level1?: string;
    level2?: string;
    level3?: string;
    level4?: string;
    level5?: string;
  };
}

export interface IStudentProfile {
  id: string;
  userId: string;
  studentId: string;
  universityId: string;
  collegeId: string;
  departmentId: string;
  programId: string;
  batchId?: string;
  studentStatus: StudentStatus;
  gpa: number;
  maxGpa: number;
  creditsCompleted: number;
  expectedGraduationDate: string;
  specialization: string;
  skills: Array<{
    skillId: string;
    level: number;
    verified: boolean;
  }>;
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
    url?: string;
  }>;
  certificates: Array<{
    title: string;
    issuer: string;
    issueDate: string;
    credentialUrl?: string;
  }>;
  languages: Array<{
    language: string;
    proficiency: 'BASIC' | 'INTERMEDIATE' | 'FLUENT' | 'NATIVE';
  }>;
  activities: Array<{
    role: string;
    organization: string;
    startDate: string;
    endDate?: string;
  }>;
  cvUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  profileCompletionScore: number;
}

export interface ICompany {
  id: string;
  nameEn: string;
  nameAr: string;
  logoUrl?: string;
  descriptionEn: string;
  descriptionAr?: string;
  sector: string;
  industry: string;
  companySize: 'STARTUP' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
  cities: string[];
  website?: string;
  isVerified: boolean;
  trainingToEmploymentRate?: number;
  averageRating?: number;
  totalTrained?: number;
  totalEmployed?: number;
}

export interface IOpportunity {
  id: string;
  companyId: string;
  company?: ICompany;
  titleEn: string;
  titleAr?: string;
  type: OpportunityType;
  descriptionEn: string;
  descriptionAr?: string;
  location: string;
  city: string;
  workMode: WorkMode;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  numberOfSeats: number;
  seatsRemaining: number;
  requiredSpecializations: string[];
  requiredSkills: Array<{
    skillId: string;
    skillNameEn: string;
    minimumLevel: number;
  }>;
  minimumGPA: number;
  experienceYears?: number;
  salary?: number;
  stipend?: number;
  benefits?: string[];
  requirements?: string[];
  responsibilities?: string[];
  status: OpportunityStatus;
  createdAt: string;
}

export interface IApplication {
  id: string;
  opportunityId: string;
  opportunity?: IOpportunity;
  studentId: string;
  student?: IStudentProfile & { user?: IUser };
  status: ApplicationStatus;
  cvUrl?: string;
  coverLetter?: string;
  matchScore?: number;
  notes?: string;
  submittedAt: string;
  updatedAt: string;
}

export interface IInterview {
  id: string;
  applicationId: string;
  studentId: string;
  companyId: string;
  date: string;
  time: string;
  type: InterviewType;
  location?: string;
  meetingUrl?: string;
  interviewers: string[];
  notes?: string;
  result?: 'RECOMMENDED' | 'NOT_RECOMMENDED' | 'PENDING';
  status: InterviewStatus;
}

export interface ITraining {
  id: string;
  studentId: string;
  student?: IStudentProfile & { user?: IUser };
  companyId: string;
  company?: ICompany;
  opportunityId: string;
  opportunity?: IOpportunity;
  trainingEntityName: string;
  startDate: string;
  endDate: string;
  durationWeeks: number;
  academicSupervisorId?: string;
  companySupervisorId?: string;
  status: TrainingStatus;
  attendancePercentage?: number;
  finalGrade?: number;
}

export interface ITrainingAttendance {
  id: string;
  trainingId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  hours: number;
  notes?: string;
}

export interface ITrainingTask {
  id: string;
  trainingId: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  completedAt?: string;
  comments?: string;
}

export interface ITrainingEvaluation {
  id: string;
  trainingId: string;
  evaluatorId: string;
  evaluatorType: 'COMPANY_SUPERVISOR' | 'ACADEMIC_SUPERVISOR';
  technicalSkills: number;     // 1-5
  communication: number;       // 1-5
  problemSolving: number;      // 1-5
  teamwork: number;            // 1-5
  professionalism: number;     // 1-5
  attendance: number;          // 1-5
  qualityOfWork: number;       // 1-5
  initiative: number;          // 1-5
  learningAbility: number;     // 1-5
  overallPerformance: number;  // 1-5
  averageScore: number;
  feedback?: string;
  date: string;
}

export interface ICompanyEvaluation {
  id: string;
  trainingId: string;
  studentId: string;
  companyId: string;
  trainingQuality: number;        // 1-5
  tasksRelevance: number;         // 1-5
  supervisionQuality: number;     // 1-5
  workEnvironment: number;        // 1-5
  specializationRelevance: number;// 1-5
  learningOpportunities: number;  // 1-5
  employmentOpportunities: number;// 1-5
  averageScore: number;
  comments?: string;
  date: string;
}

export interface IJobOffer {
  id: string;
  trainingId?: string;
  studentId: string;
  companyId: string;
  jobTitleEn: string;
  jobTitleAr?: string;
  salary: number;
  city: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
  startDate: string;
  offerDate: string;
  status: JobOfferStatus;
}

export interface IGraduateTracking {
  id: string;
  studentId: string;
  programId: string;
  graduationYear: number;
  milestone: '3_MONTHS' | '6_MONTHS' | '12_MONTHS' | '24_MONTHS';
  employmentStatus: 'EMPLOYED' | 'UNEMPLOYED' | 'SEEKING' | 'HIGHER_STUDIES';
  employerName?: string;
  jobTitle?: string;
  sector?: string;
  salaryRange?: string;
  specializationRelevance: 'DIRECTLY_RELATED' | 'SOMEWHAT_RELATED' | 'NOT_RELATED';
  graduateSatisfactionRating: number; // 1-5
  employerSatisfactionRating?: number; // 1-5
  surveyDate: string;
}

export interface ISkillGap {
  id: string;
  programId: string;
  skillId: string;
  skillName: string;
  marketDemandPercentage: number;
  programCoveragePercentage: number;
  gapPercentage: number;
  recommendedAction: string;
}

export interface IAlert {
  id: string;
  severity: AlertSeverity;
  titleEn: string;
  titleAr?: string;
  descriptionEn: string;
  descriptionAr?: string;
  category: 'STUDENT_TRAINING' | 'PROGRAM_EMPLOYMENT' | 'OPPORTUNITY_TREND' | 'COMPANY_CONVERSION' | 'ATTENDANCE_WARNING';
  entityType: string;
  entityId: string;
  resolved: boolean;
  createdAt: string;
}

export interface IAuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  previousStatus?: string;
  newStatus?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

// Matching Engine Types
export interface IMatchScoreResult {
  score: number; // 0-100
  breakdown: {
    specializationScore: number;
    skillsScore: number;
    academicEligibilityScore: number;
    gpaScore: number;
    experienceScore: number;
    locationScore: number;
    otherScore: number;
  };
  matchedSkills: Array<{ skillId: string; name: string; studentLevel: number; requiredLevel: number }>;
  missingSkills: Array<{ skillId: string; name: string; requiredLevel: number }>;
  matchedCourses: Array<{ courseCode: string; name: string }>;
  recommendedCourses: Array<{ courseCode: string; name: string; targetSkill: string }>;
  eligibility: {
    eligible: boolean;
    reasons: string[];
  };
  explanation: string;
}

export interface IMatchingWeights {
  specialization: number;
  skills: number;
  academicEligibility: number;
  gpa: number;
  experience: number;
  location: number;
  other: number;
}
