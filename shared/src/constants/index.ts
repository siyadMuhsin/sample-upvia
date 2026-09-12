// UPVIA BRAND CONSTANTS & DESIGN SYSTEM TOKENS
export const BRAND_COLORS = {
  NAVY: '#0B1B3A',
  NAVY_LIGHT: '#162B55',
  BLUE: '#1A56DB',
  CYAN: '#22D3EE',
  MIST: '#F1F5F9',
  WHITE: '#FFFFFF',
  SECONDARY_TEXT: '#42506B',
  SKY_100: '#EFF6FF',
  SKY_200: '#DBEAFE',
  SKY_300: '#93C5FD',
  BORDER: '#E2E8F0',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  DANGER: '#EF4444'
} as const;

export const BRAND_INFO = {
  NAME_EN: 'Upvia',
  NAME_AR: 'أبفيا',
  TAGLINE_EN: 'UPGRADE • PROTECT • MOVE FORWARD',
  TAGLINE_AR: 'منصة التدريب التعاوني والتوظيف والذكاء المهني',
  RATIO: {
    WHITE: 70,
    NAVY: 20,
    BLUE_CYAN: 10
  }
} as const;

// ROLES & PERMISSIONS
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  UNIVERSITY_ADMIN = 'UNIVERSITY_ADMIN',
  UNIVERSITY_LEADERSHIP = 'UNIVERSITY_LEADERSHIP',
  STUDY_PLAN_DIRECTOR = 'STUDY_PLAN_DIRECTOR',
  COLLEGE_DEAN = 'COLLEGE_DEAN',
  COLLEGE_VICE_DEAN = 'COLLEGE_VICE_DEAN',
  PROGRAM_COORDINATOR = 'PROGRAM_COORDINATOR',
  COOPERATIVE_TRAINING_UNIT = 'COOPERATIVE_TRAINING_UNIT',
  ALUMNI_EMPLOYMENT_UNIT = 'ALUMNI_EMPLOYMENT_UNIT',
  STUDENT = 'STUDENT',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  COMPANY_RECRUITER = 'COMPANY_RECRUITER',
  ACADEMIC_SUPERVISOR = 'ACADEMIC_SUPERVISOR',
  TRAINING_ENTITY_SUPERVISOR = 'TRAINING_ENTITY_SUPERVISOR',
  REPORT_VIEWER = 'REPORT_VIEWER'
}

export const PERMISSIONS = {
  // Students
  STUDENTS_READ: 'students.read',
  STUDENTS_CREATE: 'students.create',
  STUDENTS_UPDATE: 'students.update',
  STUDENTS_DELETE: 'students.delete',

  // Opportunities
  OPPORTUNITIES_READ: 'opportunities.read',
  OPPORTUNITIES_CREATE: 'opportunities.create',
  OPPORTUNITIES_UPDATE: 'opportunities.update',
  OPPORTUNITIES_DELETE: 'opportunities.delete',
  OPPORTUNITIES_REVIEW_PROGRAM: 'opportunities.review_program',
  OPPORTUNITIES_REVIEW_TRAINING: 'opportunities.review_training',
  OPPORTUNITIES_APPROVE: 'opportunities.approve',
  OPPORTUNITIES_PUBLISH: 'opportunities.publish',

  // Applications
  APPLICATIONS_APPLY: 'applications.apply',
  APPLICATIONS_READ: 'applications.read',
  APPLICATIONS_REVIEW: 'applications.review',
  APPLICATIONS_SHORTLIST: 'applications.shortlist',
  APPLICATIONS_SELECT: 'applications.select',

  // Training
  TRAINING_READ: 'training.read',
  TRAINING_CREATE: 'training.create',
  TRAINING_NOMINATE: 'training.nominate',
  TRAINING_ACCREDIT: 'training.accredit',
  TRAINING_APPROVE: 'training.approve',
  TRAINING_ATTENDANCE_LOG: 'training.attendance_log',
  TRAINING_ATTENDANCE_VIEW: 'training.attendance_view',
  TRAINING_TASK_MANAGE: 'training.task_manage',
  TRAINING_REPORT_SUBMIT: 'training.report_submit',
  TRAINING_EVALUATE: 'training.evaluate',

  // Study Plans & Courses
  STUDY_PLANS_READ: 'study_plans.read',
  STUDY_PLANS_MANAGE: 'study_plans.manage',
  COURSES_READ: 'courses.read',
  COURSES_MANAGE: 'courses.manage',
  SKILLS_MANAGE: 'skills.manage',

  // Analytics & Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_LEADERSHIP: 'analytics.leadership',

  // Admin & Audit
  AUDIT_VIEW: 'audit.view',
  USERS_MANAGE: 'users.manage',
  SETTINGS_MANAGE: 'settings.manage'
} as const;

// STATUS ENUMS
export enum StudentStatus {
  NEW = 'NEW',
  CURRENT_STUDENT = 'CURRENT_STUDENT',
  EXPECTED_GRADUATE = 'EXPECTED_GRADUATE',
  GRADUATE = 'GRADUATE'
}

export enum SkillCategory {
  TECHNICAL = 'Technical',
  SOFT_SKILLS = 'Soft Skills',
  TOOLS = 'Tools',
  DOMAIN_SKILLS = 'Domain Skills',
  PROFESSIONAL_SKILLS = 'Professional Skills',
  LANGUAGES = 'Languages'
}

export enum OpportunityType {
  COOP_TRAINING = 'COOP_TRAINING',
  SUMMER_TRAINING = 'SUMMER_TRAINING',
  INTERNSHIP = 'INTERNSHIP',
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  GRADUATE_PROGRAM = 'GRADUATE_PROGRAM',
  PROFESSIONAL_DEVELOPMENT = 'PROFESSIONAL_DEVELOPMENT'
}

export enum OpportunityStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PROGRAM_REVIEW = 'PROGRAM_REVIEW',
  TRAINING_UNIT_REVIEW = 'TRAINING_UNIT_REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED'
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW = 'INTERVIEW',
  SELECTED = 'SELECTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN'
}

export enum InterviewType {
  ONLINE = 'ONLINE',
  PHONE = 'PHONE',
  ONSITE = 'ONSITE',
  PANEL = 'PANEL'
}

export enum InterviewStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED'
}

export enum TrainingStatus {
  NOMINATED = 'NOMINATED',
  COMPANY_ADMISSION = 'COMPANY_ADMISSION',
  UNIVERSITY_ACCREDITED = 'UNIVERSITY_ACCREDITED',
  IN_TRAINING = 'IN_TRAINING',
  COMPLETED = 'COMPLETED',
  TERMINATED = 'TERMINATED'
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE'
}

export enum JobOfferStatus {
  SUBMITTED = 'SUBMITTED',
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export enum AlertSeverity {
  RED = 'RED',
  ORANGE = 'ORANGE',
  GREEN = 'GREEN'
}

export enum WorkMode {
  ON_SITE = 'ON_SITE',
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID'
}

// MATCHING ENGINE DEFAULT WEIGHTS
export const DEFAULT_MATCHING_WEIGHTS = {
  SPECIALIZATION: 0.30,
  SKILLS: 0.30,
  ACADEMIC_ELIGIBILITY: 0.15,
  GPA: 0.10,
  EXPERIENCE: 0.05,
  LOCATION: 0.05,
  OTHER: 0.05
} as const;
