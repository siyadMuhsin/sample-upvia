import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { hashPassword } from '../utils/password.util';
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
  WorkMode,
} from '@upvia/shared';
import {
  User,
  University,
  College,
  Department,
  Program,
  Batch,
  Course,
  StudyPlan,
  Skill,
  Company,
  Opportunity,
  Student,
  Application,
  Interview,
  Training,
  TrainingAttendance,
  TrainingTask,
  TrainingReport,
  TrainingEvaluation,
  CompanyEvaluation,
  JobOffer,
  Graduate,
  GraduateFollowUp,
  EmploymentRecord,
  SkillGap,
  AlertRule,
  Alert,
  AuditLog,
  Notification,
} from '../models';

export const runSeed = async (shouldDisconnect: boolean = true) => {
  console.log('🌱 Starting Upvia Realistic Database Seeding...');
  await connectDatabase();

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    University.deleteMany({}),
    College.deleteMany({}),
    Department.deleteMany({}),
    Program.deleteMany({}),
    Batch.deleteMany({}),
    Course.deleteMany({}),
    StudyPlan.deleteMany({}),
    Skill.deleteMany({}),
    Company.deleteMany({}),
    Opportunity.deleteMany({}),
    Student.deleteMany({}),
    Application.deleteMany({}),
    Interview.deleteMany({}),
    Training.deleteMany({}),
    TrainingAttendance.deleteMany({}),
    TrainingTask.deleteMany({}),
    TrainingReport.deleteMany({}),
    TrainingEvaluation.deleteMany({}),
    CompanyEvaluation.deleteMany({}),
    JobOffer.deleteMany({}),
    Graduate.deleteMany({}),
    GraduateFollowUp.deleteMany({}),
    EmploymentRecord.deleteMany({}),
    SkillGap.deleteMany({}),
    AlertRule.deleteMany({}),
    Alert.deleteMany({}),
    AuditLog.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  const defaultPasswordHash = await hashPassword('Password123!');

  // 1. Seed University
  const university = await University.create({
    nameEn: 'King Fahd University of Petroleum & Minerals (KFUPM)',
    nameAr: 'جامعة الملك فهد للبترول والمعادن',
    code: 'KFUPM',
    city: 'Dhahran',
    country: 'Saudi Arabia',
    website: 'https://www.kfupm.edu.sa',
    logoUrl: '/brands/kfupm.png',
  });

  // 2. Seed 5 Colleges
  const collegesData = [
    {
      nameEn: 'College of Computing & Mathematics',
      nameAr: 'كلية علوم وهندسة الحاسب الآلي والرياضيات',
      code: 'CCM',
      deanName: 'Dr. Tariq Al-Ghamdi',
    },
    {
      nameEn: 'College of Engineering & Physics',
      nameAr: 'كلية الهندسة والفيزياء',
      code: 'CEP',
      deanName: 'Dr. Khalid Al-Sultan',
    },
    {
      nameEn: 'KFUPM Business School',
      nameAr: 'كلية الإدارة الصناعية',
      code: 'KBS',
      deanName: 'Dr. Faisal Al-Shammari',
    },
    {
      nameEn: 'College of Chemicals & Materials',
      nameAr: 'كلية الكيمياء والمواد',
      code: 'CCM-MAT',
      deanName: 'Dr. Mansour Al-Harbi',
    },
    {
      nameEn: 'College of Petroleum Engineering & Geosciences',
      nameAr: 'كلية هندسة البترول وعلوم الأرض',
      code: 'CPG',
      deanName: 'Dr. Abdullah Al-Otaibi',
    },
  ];

  const colleges = await Promise.all(
    collegesData.map((c) =>
      College.create({
        universityId: university._id,
        ...c,
      })
    )
  );

  const computingCollege = colleges[0];
  const engineeringCollege = colleges[1];
  const businessCollege = colleges[2];

  // 3. Seed Departments
  const departmentsData = [
    { collegeId: computingCollege._id, nameEn: 'Information & Computer Science', nameAr: 'علوم الحاسب والمعلومات', code: 'ICS' },
    { collegeId: computingCollege._id, nameEn: 'Computer Engineering', nameAr: 'هندسة الحاسب الآلي', code: 'COE' },
    { collegeId: engineeringCollege._id, nameEn: 'Electrical Engineering', nameAr: 'الهندسة الكهربائية', code: 'EE' },
    { collegeId: engineeringCollege._id, nameEn: 'Mechanical Engineering', nameAr: 'الهندسة الميكانيكية', code: 'ME' },
    { collegeId: businessCollege._id, nameEn: 'Management & Marketing', nameAr: 'الإدارة والتسويق', code: 'MGT' },
    { collegeId: businessCollege._id, nameEn: 'Accounting & Finance', nameAr: 'المحاسبة والمالية', code: 'FIN' },
  ];

  const departments = await Promise.all(departmentsData.map((d) => Department.create(d)));
  const icsDept = departments[0];
  const coeDept = departments[1];

  // 4. Seed Programs
  const programsData = [
    {
      departmentId: icsDept._id,
      collegeId: computingCollege._id,
      nameEn: 'Software Engineering',
      nameAr: 'هندسة البرمجيات',
      code: 'SWE',
      degreeLevel: 'BACHELOR',
      targetEmploymentRate: 90,
      currentEmploymentRate: 92.5,
      totalCredits: 132,
    },
    {
      departmentId: icsDept._id,
      collegeId: computingCollege._id,
      nameEn: 'Computer Science & AI',
      nameAr: 'علوم الحاسب والذكاء الاصطناعي',
      code: 'CS',
      degreeLevel: 'BACHELOR',
      targetEmploymentRate: 92,
      currentEmploymentRate: 94.0,
      totalCredits: 130,
    },
    {
      departmentId: coeDept._id,
      collegeId: computingCollege._id,
      nameEn: 'Cybersecurity & Computer Networks',
      nameAr: 'الأمن السيبراني وشبكات الحاسب',
      code: 'CSEC',
      degreeLevel: 'BACHELOR',
      targetEmploymentRate: 95,
      currentEmploymentRate: 96.2,
      totalCredits: 134,
    },
    {
      departmentId: departments[2]._id,
      collegeId: engineeringCollege._id,
      nameEn: 'Electrical & Electronics Engineering',
      nameAr: 'الهندسة الكهربائية والإلكترونيات',
      code: 'EE',
      degreeLevel: 'BACHELOR',
      targetEmploymentRate: 88,
      currentEmploymentRate: 84.5,
      totalCredits: 136,
    },
    {
      departmentId: departments[4]._id,
      collegeId: businessCollege._id,
      nameEn: 'Business Analytics & Decision Science',
      nameAr: 'تحليل الأعمال وعلوم القرار',
      code: 'BADS',
      degreeLevel: 'BACHELOR',
      targetEmploymentRate: 85,
      currentEmploymentRate: 81.0,
      totalCredits: 128,
    },
  ];

  const programs = await Promise.all(programsData.map((p) => Program.create(p)));
  const sweProgram = programs[0];
  const csProgram = programs[1];

  // 5. Seed Batches
  const currentYear = new Date().getFullYear();
  const batch = await Batch.create({
    universityId: university._id,
    nameEn: `Class of ${currentYear} Spring`,
    nameAr: `دفعة ربيع ${currentYear}`,
    year: currentYear,
    semester: 'SPRING',
  });

  // 6. Seed Skills Taxonomy
  const skillsData = [
    { nameEn: 'Full-Stack Web Development', nameAr: 'تطوير الويب المتكامل', category: SkillCategory.TECHNICAL },
    { nameEn: 'TypeScript & JavaScript', nameAr: 'لغات تايب سكريبت وجافا سكريبت', category: SkillCategory.TECHNICAL },
    { nameEn: 'React & Next.js', nameAr: 'أطر ريآكت ونكست', category: SkillCategory.TECHNICAL },
    { nameEn: 'Node.js & Express', nameAr: 'بيئة نود وأطر إكسبريس', category: SkillCategory.TECHNICAL },
    { nameEn: 'MongoDB & Database Design', nameAr: 'قواعد بيانات مونغو وتصميم البيانات', category: SkillCategory.TECHNICAL },
    { nameEn: 'Python & Data Analysis', nameAr: 'بايثون وتحليل البيانات', category: SkillCategory.TECHNICAL },
    { nameEn: 'Machine Learning & AI', nameAr: 'تعلم الآلة والذكاء الاصطناعي', category: SkillCategory.TECHNICAL },
    { nameEn: 'Cybersecurity Architecture', nameAr: 'معمارية الأمن السيبراني', category: SkillCategory.TECHNICAL },
    { nameEn: 'DevOps & Docker CI/CD', nameAr: 'ديف أوبس والحاويات والنشر المستمر', category: SkillCategory.TOOLS },
    { nameEn: 'Cloud Computing (AWS / Azure)', nameAr: 'الحوسبة السحابية', category: SkillCategory.DOMAIN_SKILLS },
    { nameEn: 'Agile & Scrum Methodologies', nameAr: 'إدارة المشاريع بالمنهجية المرنة', category: SkillCategory.PROFESSIONAL_SKILLS },
    { nameEn: 'Effective Technical Communication', nameAr: 'التواصل التقني الفعال', category: SkillCategory.SOFT_SKILLS },
    { nameEn: 'Critical Thinking & Problem Solving', nameAr: 'التفكير النقدي وحل المشكلات', category: SkillCategory.SOFT_SKILLS },
    { nameEn: 'Arabic Professional Fluency', nameAr: 'اللغة العربية المهنية', category: SkillCategory.LANGUAGES },
    { nameEn: 'English Professional Fluency', nameAr: 'اللغة الإنجليزية المهنية', category: SkillCategory.LANGUAGES },
  ];

  const skills = await Promise.all(skillsData.map((s) => Skill.create(s)));

  // 7. Seed Courses
  const coursesData = [
    {
      courseCode: 'SWE-316',
      nameEn: 'Software Design and Architecture',
      nameAr: 'تصميم وبناء البرمجيات',
      credits: 3,
      semester: 5,
      required: true,
      departmentId: icsDept._id,
      prerequisites: ['ICS-202'],
      skills: [
        { skillId: skills[0]._id, skillNameEn: skills[0].nameEn, levelTaught: 3 },
        { skillId: skills[1]._id, skillNameEn: skills[1].nameEn, levelTaught: 3 },
      ],
    },
    {
      courseCode: 'SWE-363',
      nameEn: 'Web Engineering & Development',
      nameAr: 'هندسة وتطوير الويب',
      credits: 3,
      semester: 6,
      required: true,
      departmentId: icsDept._id,
      prerequisites: ['SWE-316'],
      skills: [
        { skillId: skills[2]._id, skillNameEn: skills[2].nameEn, levelTaught: 4 },
        { skillId: skills[3]._id, skillNameEn: skills[3].nameEn, levelTaught: 4 },
        { skillId: skills[4]._id, skillNameEn: skills[4].nameEn, levelTaught: 3 },
      ],
    },
    {
      courseCode: 'SWE-350',
      nameEn: 'Cooperative Training Placement I',
      nameAr: 'التدريب التعاوني الأول',
      credits: 9,
      semester: 7,
      required: true,
      departmentId: icsDept._id,
      prerequisites: ['SWE-363'],
      skills: [
        { skillId: skills[10]._id, skillNameEn: skills[10].nameEn, levelTaught: 4 },
        { skillId: skills[11]._id, skillNameEn: skills[11].nameEn, levelTaught: 4 },
        { skillId: skills[12]._id, skillNameEn: skills[12].nameEn, levelTaught: 4 },
      ],
    },
  ];

  const courses = await Promise.all(coursesData.map((c) => Course.create(c)));

  // 8. Seed Study Plan
  const studyPlan = await StudyPlan.create({
    programId: sweProgram._id,
    version: '2024.2',
    year: currentYear,
    isPublished: true,
    totalCredits: 132,
    courses: courses.map((c, idx) => ({
      courseId: c._id,
      semester: c.semester,
      isRequired: true,
    })),
    learningOutcomes: [
      'Analyze complex computing problems and apply principles of software engineering',
      'Design, implement, and evaluate computing-based solutions in high-scale industry environments',
      'Communicate effectively in professional and technical contexts across enterprise teams',
    ],
  });

  // 9. Seed Realistic Companies
  const companiesData = [
    {
      nameEn: 'Saudi Aramco Digital',
      nameAr: 'أرامكو السعودية للحلول الرقمية',
      descriptionEn: 'The digital innovation, energy tech, and enterprise cloud arm of Saudi Aramco.',
      descriptionAr: 'ذراع التحول والابتكار الرقمي وتقنيات الطاقة في أرامكو السعودية.',
      sector: 'Energy & Technology',
      industry: 'Oil & Gas Tech / Cloud Infrastructure',
      companySize: 'ENTERPRISE',
      cities: ['Dhahran', 'Riyadh', 'Khobar'],
      website: 'https://www.aramco.com',
      isVerified: true,
      totalSeatsOffered: 45,
      studentsAccepted: 38,
      studentsTrained: 32,
      studentsEmployed: 28,
      trainingToEmploymentRate: 87.5,
      averageRating: 4.9,
      contacts: [
        { name: 'Eng. Khalid Al-Mansoor', email: 'khalid.mansoor@aramco.com', phone: '+966138720100', role: 'Talent Acquisition Director' },
      ],
      requiredSpecializations: ['Software Engineering', 'Computer Science & AI', 'Cybersecurity'],
    },
    {
      nameEn: 'Elm Information Security & Digital Solutions',
      nameAr: 'شركة علم للحلول الرقمية وأمن المعلومات',
      descriptionEn: 'Leading government and enterprise digital transformation and trust services pioneer.',
      descriptionAr: 'الشركة الرائدة في التحول الرقمي الحكومي والخدمات الآمنة.',
      sector: 'Digital Transformation & GovTech',
      industry: 'Software & Cloud Services',
      companySize: 'ENTERPRISE',
      cities: ['Riyadh', 'Jeddah', 'Dammam'],
      website: 'https://elm.sa',
      isVerified: true,
      totalSeatsOffered: 30,
      studentsAccepted: 25,
      studentsTrained: 22,
      studentsEmployed: 19,
      trainingToEmploymentRate: 86.4,
      averageRating: 4.8,
      contacts: [
        { name: 'Noura Al-Husseini', email: 'recruiter.elm@upvia.com', phone: '+966112887700', role: 'Campus Recruiting Lead' },
      ],
      requiredSpecializations: ['Software Engineering', 'Computer Science & AI', 'Business Analytics'],
    },
    {
      nameEn: 'Lucid Motors Saudi Arabia',
      nameAr: 'شركة لوسيد موتورز لصناعة السيارات الكهربائية',
      descriptionEn: 'Cutting-edge electric vehicle manufacturing, software telemetry, and advanced autonomy systems.',
      descriptionAr: 'تصنيع المركبات الكهربائية المتقدمة والأنظمة الذكية في مدينة الملك عبدالله الاقتصادية.',
      sector: 'Advanced Mobility & CleanTech',
      industry: 'Automotive & Embedded Systems',
      companySize: 'LARGE',
      cities: ['King Abdullah Economic City', 'Riyadh'],
      website: 'https://lucidmotors.com',
      isVerified: true,
      totalSeatsOffered: 20,
      studentsAccepted: 16,
      studentsTrained: 14,
      studentsEmployed: 11,
      trainingToEmploymentRate: 78.6,
      averageRating: 4.7,
      contacts: [
        { name: 'Marcus Sterling', email: 'careers.sa@lucidmotors.com', phone: '+966126001000', role: 'Engineering Talent Lead' },
      ],
      requiredSpecializations: ['Software Engineering', 'Electrical Engineering', 'Mechanical Engineering'],
    },
    {
      nameEn: 'STC (Solutions by stc)',
      nameAr: 'شركة الاتصالات السعودية (حلول إس تي سي)',
      descriptionEn: 'The leading provider of end-to-end IT, telecommunications, and 5G enterprise infrastructure.',
      descriptionAr: 'المزود الأول لخدمات الاتصالات وتقنية المعلومات المتقدمة في الشرق الأوسط.',
      sector: 'Telecommunications & Cloud',
      industry: 'Enterprise Networks & IoT',
      companySize: 'ENTERPRISE',
      cities: ['Riyadh', 'Dammam', 'Jeddah'],
      website: 'https://solutions.com.sa',
      isVerified: true,
      totalSeatsOffered: 40,
      studentsAccepted: 35,
      studentsTrained: 30,
      studentsEmployed: 26,
      trainingToEmploymentRate: 86.7,
      averageRating: 4.8,
      contacts: [
        { name: 'Fahad Al-Khatib', email: 'company.admin@upvia.com', phone: '+966114555555', role: 'University Partnerships VP' },
      ],
      requiredSpecializations: ['Cybersecurity', 'Software Engineering', 'Computer Science & AI'],
    },
  ];

  const companies = await Promise.all(companiesData.map((c) => Company.create(c)));
  const aramcoCompany = companies[0];
  const elmCompany = companies[1];
  const stcCompany = companies[3];

  // 10. Seed Demo Users for All 15 Specific Roles
  const demoUsersData = [
    {
      email: 'superadmin@upvia.com',
      firstNameEn: 'Sultan',
      lastNameEn: 'Al-Ghamdi',
      firstNameAr: 'سلطان',
      lastNameAr: 'الغامدي',
      role: UserRole.SUPER_ADMIN,
    },
    {
      email: 'leadership@upvia.com',
      emailVerified: true,
      firstNameEn: 'Dr. Mohammed',
      lastNameEn: 'Al-Saud',
      firstNameAr: 'د. محمد',
      lastNameAr: 'السعود',
      role: UserRole.UNIVERSITY_LEADERSHIP,
      universityId: university._id,
    },
    {
      email: 'admin.univ@upvia.com',
      firstNameEn: 'Abdullah',
      lastNameEn: 'Al-Dosari',
      firstNameAr: 'عبدالله',
      lastNameAr: 'الدوسري',
      role: UserRole.UNIVERSITY_ADMIN,
      universityId: university._id,
    },
    {
      email: 'director.plans@upvia.com',
      firstNameEn: 'Dr. Reem',
      lastNameEn: 'Al-Fawzan',
      firstNameAr: 'د. ريم',
      lastNameAr: 'الفوزان',
      role: UserRole.STUDY_PLAN_DIRECTOR,
      universityId: university._id,
      collegeId: computingCollege._id,
    },
    {
      email: 'dean.computing@upvia.com',
      firstNameEn: 'Dr. Tariq',
      lastNameEn: 'Al-Ghamdi',
      firstNameAr: 'د. طارق',
      lastNameAr: 'الغامدي',
      role: UserRole.COLLEGE_DEAN,
      universityId: university._id,
      collegeId: computingCollege._id,
    },
    {
      email: 'vicedean.computing@upvia.com',
      firstNameEn: 'Dr. Majed',
      lastNameEn: 'Al-Zahrani',
      firstNameAr: 'د. ماجد',
      lastNameAr: 'الزهراني',
      role: UserRole.COLLEGE_VICE_DEAN,
      universityId: university._id,
      collegeId: computingCollege._id,
    },
    {
      email: 'coordinator.se@upvia.com',
      firstNameEn: 'Dr. Hisham',
      lastNameEn: 'Al-Barrak',
      firstNameAr: 'د. هشام',
      lastNameAr: 'البراك',
      role: UserRole.PROGRAM_COORDINATOR,
      universityId: university._id,
      collegeId: computingCollege._id,
      departmentId: icsDept._id,
      programId: sweProgram._id,
    },
    {
      email: 'training.unit@upvia.com',
      firstNameEn: 'Abdulaziz',
      lastNameEn: 'Al-Mutairi',
      firstNameAr: 'عبدالعزيز',
      lastNameAr: 'المطيري',
      role: UserRole.COOPERATIVE_TRAINING_UNIT,
      universityId: university._id,
    },
    {
      email: 'alumni.unit@upvia.com',
      firstNameEn: 'Sarah',
      lastNameEn: 'Al-Qasim',
      firstNameAr: 'سارة',
      lastNameAr: 'القاسم',
      role: UserRole.ALUMNI_EMPLOYMENT_UNIT,
      universityId: university._id,
    },
    {
      email: 'company.admin@upvia.com',
      firstNameEn: 'Fahad',
      lastNameEn: 'Al-Khatib',
      firstNameAr: 'فهد',
      lastNameAr: 'الخطيب',
      role: UserRole.COMPANY_ADMIN,
      companyId: stcCompany._id,
    },
    {
      email: 'recruiter.elm@upvia.com',
      firstNameEn: 'Noura',
      lastNameEn: 'Al-Husseini',
      firstNameAr: 'نورة',
      lastNameAr: 'الحسيني',
      role: UserRole.COMPANY_RECRUITER,
      companyId: elmCompany._id,
    },
    {
      email: 'supervisor.academic@upvia.com',
      firstNameEn: 'Dr. Yasser',
      lastNameEn: 'Al-Najjar',
      firstNameAr: 'د. ياسر',
      lastNameAr: 'النجار',
      role: UserRole.ACADEMIC_SUPERVISOR,
      universityId: university._id,
      collegeId: computingCollege._id,
      programId: sweProgram._id,
    },
    {
      email: 'supervisor.company@upvia.com',
      firstNameEn: 'Eng. Omar',
      lastNameEn: 'Al-Jadaan',
      firstNameAr: 'م. عمر',
      lastNameAr: 'الجدعان',
      role: UserRole.TRAINING_ENTITY_SUPERVISOR,
      companyId: aramcoCompany._id,
    },
    {
      email: 'viewer.reports@upvia.com',
      firstNameEn: 'Khaled',
      lastNameEn: 'Al-Rasheed',
      firstNameAr: 'خالد',
      lastNameAr: 'الرشيد',
      role: UserRole.REPORT_VIEWER,
      universityId: university._id,
    },
    {
      email: 'student@upvia.com',
      firstNameEn: 'Ziyad',
      lastNameEn: 'Al-Hassan',
      firstNameAr: 'زياد',
      lastNameAr: 'الحسن',
      role: UserRole.STUDENT,
      universityId: university._id,
      collegeId: computingCollege._id,
      departmentId: icsDept._id,
      programId: sweProgram._id,
    },
  ];

  const seededUsers = await Promise.all(
    demoUsersData.map((u) =>
      User.create({
        ...u,
        passwordHash: defaultPasswordHash,
        isActive: true,
        isEmailVerified: true,
      })
    )
  );

  const studentUser = seededUsers.find((u) => u.email === 'student@upvia.com')!;
  const academicSupervisorUser = seededUsers.find((u) => u.email === 'supervisor.academic@upvia.com')!;
  const companySupervisorUser = seededUsers.find((u) => u.email === 'supervisor.company@upvia.com')!;

  // 11. Seed Student Profile
  const student = await Student.create({
    userId: studentUser._id,
    studentId: '202058490',
    universityId: university._id,
    collegeId: computingCollege._id,
    departmentId: icsDept._id,
    programId: sweProgram._id,
    batchId: batch._id,
    studyPlanId: studyPlan._id,
    studentStatus: StudentStatus.CURRENT_STUDENT,
    expectedGraduationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // ~6 months
    specialization: 'Software Engineering',
    gpa: 3.82,
    maxGpa: 4.0,
    creditsCompleted: 104,
    passedCourses: ['SWE-316', 'SWE-363', 'ICS-202', 'ICS-253', 'COE-301'],
    skills: [
      { skillId: skills[0]._id, skillNameEn: skills[0].nameEn, level: 4, verified: true },
      { skillId: skills[1]._id, skillNameEn: skills[1].nameEn, level: 4, verified: true },
      { skillId: skills[2]._id, skillNameEn: skills[2].nameEn, level: 4, verified: true },
      { skillId: skills[3]._id, skillNameEn: skills[3].nameEn, level: 3, verified: true },
      { skillId: skills[4]._id, skillNameEn: skills[4].nameEn, level: 3, verified: true },
      { skillId: skills[8]._id, skillNameEn: skills[8].nameEn, level: 3, verified: false },
      { skillId: skills[11]._id, skillNameEn: skills[11].nameEn, level: 4, verified: true },
      { skillId: skills[12]._id, skillNameEn: skills[12].nameEn, level: 4, verified: true },
    ],
    projects: [
      {
        title: 'Microservices E-Commerce Core',
        description: 'High-throughput payment gateway orchestrator using Node.js, RabbitMQ, and MongoDB.',
        technologies: ['Node.js', 'Express', 'TypeScript', 'MongoDB', 'Docker'],
        url: 'https://github.com/upvia-student/ecommerce-core',
      },
      {
        title: 'Real-time Hospital Telemetry Platform',
        description: 'React, Next.js, and WebSocket dashboard for vital patient observation.',
        technologies: ['Next.js', 'React', 'Tailwind CSS', 'WebSockets'],
        url: 'https://github.com/upvia-student/telemetry-dash',
      },
    ],
    certificates: [
      {
        title: 'AWS Certified Cloud Practitioner',
        issuer: 'Amazon Web Services',
        issueDate: new Date('2024-01-15'),
        credentialUrl: 'https://aws.amazon.com/verification/123456',
      },
    ],
    languages: [
      { language: 'Arabic', proficiency: 'NATIVE' },
      { language: 'English', proficiency: 'FLUENT' },
    ],
    activities: [
      {
        role: 'Lead Organizer',
        organization: 'KFUPM Google Developer Student Club',
        startDate: new Date('2023-09-01'),
      },
    ],
    cvUrl: '/files/cv-ziyad-al-hassan.pdf',
    linkedinUrl: 'https://linkedin.com/in/ziyad-upvia',
    githubUrl: 'https://github.com/ziyad-upvia',
    portfolioUrl: 'https://ziyad.dev',
    profileCompletionScore: 95,
  });

  // 12. Seed Published Opportunities
  const opportunitiesData = [
    {
      companyId: aramcoCompany._id,
      titleEn: 'Co-op Software Engineer — Cloud & Data Platforms',
      titleAr: 'مهندس برمجيات متدرب (تعاوني) — المنصات السحابية',
      type: OpportunityType.COOP_TRAINING,
      descriptionEn: 'Join Saudi Aramco Digital Core to engineer scalable microservices, backend data pipelines, and responsive enterprise dashboards.',
      descriptionAr: 'انضم إلى فريق أرامكو الرقمي لتطوير الخدمات البرمجية السحابية وقواعد البيانات الضخمة.',
      location: 'Dhahran Digital Hub',
      city: 'Dhahran',
      workMode: WorkMode.HYBRID,
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      numberOfSeats: 6,
      seatsRemaining: 4,
      requiredSpecializations: ['Software Engineering', 'Computer Science & AI'],
      requiredSkills: [
        { skillId: skills[0]._id, skillNameEn: skills[0].nameEn, minimumLevel: 3 },
        { skillId: skills[1]._id, skillNameEn: skills[1].nameEn, minimumLevel: 3 },
        { skillId: skills[2]._id, skillNameEn: skills[2].nameEn, minimumLevel: 3 },
        { skillId: skills[3]._id, skillNameEn: skills[3].nameEn, minimumLevel: 3 },
      ],
      minimumGPA: 3.0,
      experienceYears: 0,
      stipend: 4500,
      benefits: ['Monthly Stipend', 'Health Insurance', 'Transportation Allowance', 'Access to Enterprise Certifications'],
      requirements: ['Enrolled in recognized undergraduate university', 'Senior standing (Completed 90+ credits)', 'Fluency in English'],
      responsibilities: ['Develop clean TypeScript REST APIs', 'Participate in agile sprints and code reviews', 'Implement test suites'],
      status: OpportunityStatus.PUBLISHED,
    },
    {
      companyId: elmCompany._id,
      titleEn: 'Digital Trust & Full-Stack Trainee',
      titleAr: 'متدرب في التحول الرقمي وحلول الثقة',
      type: OpportunityType.COOP_TRAINING,
      descriptionEn: 'Work on national-scale digital identity, verified data credentials, and secure citizen portals.',
      descriptionAr: 'المشاركة في تطوير منظومات الهوية الرقمية والخدمات الحكومية الآمنة.',
      location: 'Elm HQ, Riyadh',
      city: 'Riyadh',
      workMode: WorkMode.ON_SITE,
      startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 165 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      numberOfSeats: 8,
      seatsRemaining: 7,
      requiredSpecializations: ['Software Engineering', 'Cybersecurity & Computer Networks'],
      requiredSkills: [
        { skillId: skills[1]._id, skillNameEn: skills[1].nameEn, minimumLevel: 3 },
        { skillId: skills[7]._id, skillNameEn: skills[7].nameEn, minimumLevel: 3 },
        { skillId: skills[8]._id, skillNameEn: skills[8].nameEn, minimumLevel: 2 },
      ],
      minimumGPA: 3.2,
      experienceYears: 0,
      stipend: 4000,
      benefits: ['Monthly Stipend', 'Mentorship from Senior Architects', 'Fast-track Graduate Employment Consideration'],
      requirements: ['Good understanding of web security principles', 'Knowledge of REST APIs and OAuth2'],
      responsibilities: ['Assist in vulnerability patching', 'Build frontend components using React and Tailwind'],
      status: OpportunityStatus.PUBLISHED,
    },
    {
      companyId: stcCompany._id,
      titleEn: 'Cybersecurity Operations & Network Defense Co-op',
      titleAr: 'متدرب في عمليات الأمن السيبراني والدفاع الشبكي',
      type: OpportunityType.COOP_TRAINING,
      descriptionEn: 'Defend next-generation telecom networks and cloud nodes against emerging threats.',
      descriptionAr: 'حماية شبكات الاتصالات والبنية التحتية السحابية من التهديدات السيبرانية.',
      location: 'STC Complex, Riyadh',
      city: 'Riyadh',
      workMode: WorkMode.HYBRID,
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      numberOfSeats: 5,
      seatsRemaining: 2,
      requiredSpecializations: ['Cybersecurity & Computer Networks', 'Computer Engineering'],
      requiredSkills: [
        { skillId: skills[7]._id, skillNameEn: skills[7].nameEn, minimumLevel: 3 },
        { skillId: skills[8]._id, skillNameEn: skills[8].nameEn, minimumLevel: 3 },
      ],
      minimumGPA: 3.0,
      experienceYears: 0,
      stipend: 5000,
      benefits: ['Monthly Stipend', 'Industry SOC Training', 'Medical Coverage'],
      requirements: ['Background in network protocols (TCP/IP, DNS, BGP)', 'Security fundamentals'],
      responsibilities: ['Monitor threat intelligence feeds', 'Analyze network traffic anomalies'],
      status: OpportunityStatus.PUBLISHED,
    },
  ];

  const opportunities = await Promise.all(opportunitiesData.map((o) => Opportunity.create(o)));
  const aramcoOpp = opportunities[0];
  const elmOpp = opportunities[1];

  // 13. Seed Application & Interview for Demo Student
  const application = await Application.create({
    opportunityId: aramcoOpp._id,
    studentId: student._id,
    status: ApplicationStatus.INTERVIEW,
    cvUrl: student.cvUrl,
    coverLetter: 'I am thrilled to apply for the Co-op Software Engineer role at Saudi Aramco Digital. My background in full-stack TypeScript and distributed systems aligns directly with your cloud engineering initiatives.',
    matchScore: 92,
    matchDetails: {
      specializationScore: 100,
      skillsScore: 95,
      academicEligibilityScore: 100,
      gpaScore: 95,
      explanation: '92% Match. 4 of 4 required skills matched. Specialization alignment is 100%. GPA criteria met with 3.82 / 4.0.',
    },
    notes: 'Shortlisted for technical interview due to top portfolio projects.',
  });

  await Interview.create({
    applicationId: application._id,
    studentId: student._id,
    companyId: aramcoCompany._id,
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    time: '10:00 AM AST',
    type: InterviewType.ONLINE,
    meetingUrl: 'https://teams.microsoft.com/l/meetup-join/upvia-aramco-interview-101',
    interviewers: ['Eng. Khalid Al-Mansoor', 'Dr. Faisal Al-Zahrani'],
    notes: 'Focus on distributed data processing and TypeScript architecture.',
    status: InterviewStatus.SCHEDULED,
  });

  // 14. Seed Active Training for a Placed Student
  const training = await Training.create({
    studentId: student._id,
    companyId: aramcoCompany._id,
    opportunityId: aramcoOpp._id,
    trainingEntityName: 'Saudi Aramco Digital Solutions Hub',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // started 30 days ago
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    durationWeeks: 16,
    academicSupervisorId: academicSupervisorUser._id,
    companySupervisorId: companySupervisorUser._id,
    status: TrainingStatus.IN_TRAINING,
    attendancePercentage: 96.5,
    totalHoursCompleted: 160,
    skillsAcquired: [
      { skillId: skills[0]._id, skillNameEn: skills[0].nameEn, previousLevel: 3, newLevel: 4, evidence: 'Shipped production API module' },
      { skillId: skills[8]._id, skillNameEn: skills[8].nameEn, previousLevel: 2, newLevel: 3, evidence: 'Configured Dockerized test pipeline' },
    ],
  });

  // 15. Seed Training Attendance
  const attendanceDates = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12];
  await Promise.all(
    attendanceDates.map((day) =>
      TrainingAttendance.create({
        trainingId: training._id,
        studentId: student._id,
        date: new Date(`2026-08-${day < 10 ? '0' + day : day}`),
        status: AttendanceStatus.PRESENT,
        checkIn: '08:00 AM',
        checkOut: '04:30 PM',
        hours: 8,
      })
    )
  );

  // 16. Seed Training Tasks
  await TrainingTask.create([
    {
      trainingId: training._id,
      title: 'Architect Secure Microservices Ingestion Endpoint',
      description: 'Implement an Express.js endpoint receiving high-volume sensor telemetry with rate-limiting and validation.',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: TaskStatus.IN_PROGRESS,
      priority: 'HIGH',
    },
    {
      trainingId: training._id,
      title: 'Conduct Automated Unit and Integration Test Matrix',
      description: 'Cover API endpoints with Supertest and Jest attaining at least 85% branch coverage.',
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      status: TaskStatus.TODO,
      priority: 'MEDIUM',
    },
    {
      trainingId: training._id,
      title: 'Corporate Security Onboarding & Key Management',
      description: 'Complete mandatory PKI certificate setup and VPN encryption verification.',
      dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      status: TaskStatus.COMPLETED,
      priority: 'HIGH',
      completedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
    },
  ]);

  // 17. Seed Weekly Training Report
  await TrainingReport.create({
    trainingId: training._id,
    studentId: student._id,
    reportType: 'WEEKLY',
    weekNumber: 4,
    title: 'Week 4 Progress: Telemetry Pipeline Deployment',
    activities: 'Worked alongside senior data architects to test streaming telemetry consumers in the staging environment.',
    tasksCompleted: 'Refactored error handling middleware and validated JSON schema transformations.',
    skillsApplied: ['TypeScript', 'MongoDB', 'Docker', 'REST API Architecture'],
    challenges: 'Handling network latency spikes during synthetic load testing.',
    learningOutcomes: 'Learned best practices for connection pooling in MongoDB and graceful shutdown in Node.js.',
    status: 'APPROVED',
    supervisorComments: 'Excellent work this week. Demonstrated deep ownership and proactive bug fixes.',
  });

  // 18. Seed Evaluations
  await TrainingEvaluation.create({
    trainingId: training._id,
    studentId: student._id,
    evaluatorId: companySupervisorUser._id,
    evaluatorType: 'COMPANY_SUPERVISOR',
    technicalSkills: 5,
    communication: 4,
    problemSolving: 5,
    teamwork: 5,
    professionalism: 5,
    attendance: 5,
    qualityOfWork: 5,
    initiative: 4,
    learningAbility: 5,
    overallPerformance: 5,
    averageScore: 4.8,
    feedback: 'Ziyad is an extraordinary trainee whose engineering acumen matches full-time software engineers. Highly recommended for immediate post-training hiring.',
  });

  await CompanyEvaluation.create({
    trainingId: training._id,
    studentId: student._id,
    companyId: aramcoCompany._id,
    trainingQuality: 5,
    tasksRelevance: 5,
    supervisionQuality: 5,
    workEnvironment: 5,
    specializationRelevance: 5,
    learningOpportunities: 5,
    employmentOpportunities: 5,
    averageScore: 5.0,
    comments: 'Exceptional learning environment. I received real responsibilities on production cloud systems and direct mentorship from industry leaders.',
  });

  // 19. Seed Job Offer
  await JobOffer.create({
    trainingId: training._id,
    studentId: student._id,
    companyId: aramcoCompany._id,
    jobTitleEn: 'Associate Cloud Software Engineer',
    jobTitleAr: 'مهندس برمجيات سحابية مشارك',
    salary: 18500,
    city: 'Dhahran',
    employmentType: 'FULL_TIME',
    startDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    offerDate: new Date(),
    status: JobOfferStatus.PENDING,
  });

  // 20. Seed Realistic Graduates & Employment Records
  const demoGraduates = [
    {
      name: 'Ahmed Al-Shehri',
      program: sweProgram,
      employer: 'Saudi Aramco Digital',
      company: aramcoCompany,
      title: 'Full Stack Software Engineer',
      sector: 'Energy & Technology',
      salary: 19000,
      monthsToJob: 2,
      isPostTraining: true,
      status: 'EMPLOYED',
    },
    {
      name: 'Fatimah Al-Qarni',
      program: sweProgram,
      employer: 'Elm Information Security',
      company: elmCompany,
      title: 'Backend Systems Architect',
      sector: 'GovTech & Digital Identity',
      salary: 17500,
      monthsToJob: 1,
      isPostTraining: true,
      status: 'EMPLOYED',
    },
    {
      name: 'Rayan Al-Balawi',
      program: csProgram,
      employer: 'NEOM Tech & Digital Company',
      title: 'AI & Data Infrastructure Engineer',
      sector: 'AI & Smart Cities',
      salary: 22000,
      monthsToJob: 3,
      isPostTraining: false,
      status: 'EMPLOYED',
    },
    {
      name: 'Bader Al-Otaibi',
      program: sweProgram,
      employer: 'Solutions by STC',
      company: stcCompany,
      title: 'DevOps & Cloud Engineer',
      sector: 'Telecommunications & Cloud',
      salary: 16500,
      monthsToJob: 2,
      isPostTraining: true,
      status: 'EMPLOYED',
    },
    {
      name: 'Layan Al-Harbi',
      program: sweProgram,
      employer: 'Lucid Motors',
      company: companies[2],
      title: 'Embedded Software Engineer',
      sector: 'Advanced Mobility & CleanTech',
      salary: 18000,
      monthsToJob: 4,
      isPostTraining: true,
      status: 'EMPLOYED',
    },
    {
      name: 'Saad Al-Ghamdi',
      program: sweProgram,
      status: 'SEEKING',
      monthsToJob: 6,
    },
  ];

  for (const g of demoGraduates) {
    const dummyUser = await User.create({
      email: `${g.name.toLowerCase().replace(/[\s-]/g, '.')}@alumni.upvia.com`,
      passwordHash: defaultPasswordHash,
      firstNameEn: g.name.split(' ')[0],
      lastNameEn: g.name.split(' ')[1] || 'Alumni',
      role: UserRole.STUDENT,
      universityId: university._id,
      collegeId: computingCollege._id,
      programId: g.program._id,
    });

    const dummyStudent = await Student.create({
      userId: dummyUser._id,
      studentId: `ALUMNI-${Math.floor(100000 + Math.random() * 900000)}`,
      universityId: university._id,
      collegeId: computingCollege._id,
      departmentId: icsDept._id,
      programId: g.program._id,
      studentStatus: StudentStatus.GRADUATE,
      expectedGraduationDate: new Date('2024-06-01'),
      specialization: g.program.nameEn,
      gpa: 3.65,
      maxGpa: 4.0,
      creditsCompleted: 132,
    });

    const grad = await Graduate.create({
      studentId: dummyStudent._id,
      userId: dummyUser._id,
      programId: g.program._id,
      collegeId: computingCollege._id,
      universityId: university._id,
      graduationYear: 2024,
      graduationDate: new Date('2024-06-15'),
      cumulativeGpa: dummyStudent.gpa,
      employmentStatus: g.status,
      currentEmployer: g.employer,
      currentJobTitle: g.title,
      currentSector: g.sector,
      monthsToFirstJob: g.monthsToJob,
    });

    if (g.status === 'EMPLOYED') {
      await EmploymentRecord.create({
        studentId: dummyStudent._id,
        companyId: g.company ? g.company._id : undefined,
        companyName: g.employer!,
        programId: g.program._id,
        collegeId: computingCollege._id,
        universityId: university._id,
        jobTitle: g.title!,
        sector: g.sector!,
        salary: g.salary!,
        startDate: new Date('2024-08-01'),
        isPostTrainingHire: g.isPostTraining,
        timeToEmploymentMonths: g.monthsToJob,
        skillsUsed: ['TypeScript', 'Cloud Architecture', 'Agile Delivery', 'Problem Solving'],
      });

      await GraduateFollowUp.create({
        graduateId: grad._id,
        studentId: dummyStudent._id,
        milestone: '6_MONTHS',
        employmentStatus: 'EMPLOYED',
        employerName: g.employer,
        jobTitle: g.title,
        sector: g.sector,
        monthlySalary: g.salary,
        specializationRelevance: 'DIRECTLY_RELATED',
        graduateSatisfaction: 5,
        employerSatisfaction: 5,
        requiredSkillsUsed: ['Full-Stack Development', 'Clean Code', 'API Design'],
        missingSkillsIdentified: ['Kubernetes Advanced Cluster Management'],
      });
    }
  }

  // 21. Seed Skill Gaps
  await SkillGap.create([
    {
      programId: sweProgram._id,
      skillId: skills[8]._id, // DevOps & Docker CI/CD
      skillName: skills[8].nameEn,
      marketDemandPercentage: 88,
      programCoveragePercentage: 45,
      gapPercentage: 43,
      status: 'CRITICAL_GAP',
      recommendedAction: 'Incorporate dedicated containerization, Kubernetes orchestration, and GitLab CI/CD pipelines into course SWE-363.',
      recommendedCourseUpdates: ['SWE-363 Web Engineering', 'SWE-417 Software Quality'],
    },
    {
      programId: sweProgram._id,
      skillId: skills[9]._id, // Cloud Computing
      skillName: skills[9].nameEn,
      marketDemandPercentage: 82,
      programCoveragePercentage: 50,
      gapPercentage: 32,
      status: 'MODERATE_GAP',
      recommendedAction: 'Introduce hands-on AWS/Azure serverless labs and IAM security policies in senior design courses.',
      recommendedCourseUpdates: ['SWE-316 Software Design'],
    },
  ]);

  // 22. Seed Early Warning Rules & Alerts
  const rules = await AlertRule.create([
    {
      name: 'Graduating Within 6 Months Without Training Placement',
      code: 'RULE_GRAD_NO_TRAINING',
      description: 'Identifies senior students with expected graduation under 6 months who have no registered or completed training.',
      severity: AlertSeverity.RED,
      category: 'STUDENT_TRAINING',
      thresholdValue: 6, // months
    },
    {
      name: 'Academic Program Below Target Employability',
      code: 'RULE_PROGRAM_UNDERPERFORMING',
      description: 'Triggers when a program employment rate is more than 10% below target threshold.',
      severity: AlertSeverity.RED,
      category: 'PROGRAM_EMPLOYMENT',
      thresholdValue: 10,
    },
    {
      name: 'Trainee Attendance Risk Below 80%',
      code: 'RULE_ATTENDANCE_LOW',
      description: 'Flags active cooperative training placements where trainee attendance dropped below 80%.',
      severity: AlertSeverity.ORANGE,
      category: 'ATTENDANCE_WARNING',
      thresholdValue: 80,
    },
    {
      name: 'High Conversion Partner Industrial Recognition',
      code: 'INSIGHT_HIGH_CONVERSION_PARTNER',
      description: 'Recognizes industry partners whose intern-to-fulltime hire conversion rate exceeds 75%.',
      severity: AlertSeverity.GREEN,
      category: 'COMPANY_CONVERSION',
      thresholdValue: 75,
    },
  ]);

  await Alert.create([
    {
      ruleCode: rules[3].code,
      severity: AlertSeverity.GREEN,
      category: 'COMPANY_CONVERSION',
      titleEn: 'Industry Partner Excellence: Saudi Aramco achieves 87.5% intern conversion',
      titleAr: 'شريك صناعي متميز: أرامكو السعودية تحقق 87.5% نسبة توظيف للمتدربين',
      descriptionEn: 'Saudi Aramco Digital converted 28 out of 32 co-op trainees into permanent engineering hires this academic year.',
      descriptionAr: 'وظفت أرامكو السعودية 28 من أصل 32 متدرباً تعاونياً في وظائف هندسية دائمة.',
      entityType: 'COMPANY',
      entityId: aramcoCompany._id,
      entityName: aramcoCompany.nameEn,
      resolved: false,
    },
    {
      ruleCode: rules[2].code,
      severity: AlertSeverity.ORANGE,
      category: 'ATTENDANCE_WARNING',
      titleEn: 'Attendance Advisory: 2 trainees flagged with irregular weekly check-ins',
      titleAr: 'تنبيه حضور: متدربان مسجلان بنسبة حضور غير منتظمة',
      descriptionEn: 'Academic supervisor intervention suggested for site visits in the Eastern Province.',
      descriptionAr: 'يوصى بزيارة المشرف الأكاديمي لمقر التدريب في المنطقة الشرقية.',
      entityType: 'COLLEGE',
      entityId: computingCollege._id,
      entityName: computingCollege.nameEn,
      resolved: false,
    },
  ]);

  // 23. Seed Audit Logs
  await AuditLog.create([
    {
      actorId: seededUsers[6]._id, // Coordinator
      actorName: 'Dr. Hisham Al-Barrak',
      actorRole: UserRole.PROGRAM_COORDINATOR,
      action: 'APPROVE_OPPORTUNITY_ACADEMIC',
      entity: 'Opportunity',
      entityId: aramcoOpp._id.toString(),
      previousStatus: OpportunityStatus.PROGRAM_REVIEW,
      newStatus: OpportunityStatus.TRAINING_UNIT_REVIEW,
      comment: 'Curriculum requirements and technical scope verified for Software Engineering students.',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      actorId: seededUsers[7]._id, // Training Unit
      actorName: 'Abdulaziz Al-Mutairi',
      actorRole: UserRole.COOPERATIVE_TRAINING_UNIT,
      action: 'PUBLISH_OPPORTUNITY',
      entity: 'Opportunity',
      entityId: aramcoOpp._id.toString(),
      previousStatus: OpportunityStatus.APPROVED,
      newStatus: OpportunityStatus.PUBLISHED,
      comment: 'All accreditation standards met. Opportunity published to student portal.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ]);

  // 24. Seed Notifications
  await Notification.create([
    {
      userId: studentUser._id,
      titleEn: 'Co-op Interview Scheduled: Saudi Aramco Digital',
      titleAr: 'تم تحديد موعد مقابلة تدريب تعاوني: أرامكو الرقمية',
      messageEn: 'Your technical interview has been scheduled for Thursday at 10:00 AM AST via Microsoft Teams.',
      messageAr: 'تم تحديد موعد المقابلة الفنية يوم الخميس الساعة 10:00 صباحاً عبر Teams.',
      type: 'INTERVIEW_SCHEDULED',
      link: '/student/interviews',
      isRead: false,
    },
    {
      userId: studentUser._id,
      titleEn: 'Job Offer Received!',
      titleAr: 'تم استلام عرض وظيفي!',
      messageEn: 'Congratulations! Saudi Aramco Digital has extended a full-time job offer for Associate Cloud Software Engineer.',
      messageAr: 'تهانينا! قدمت أرامكو الرقمية عرضاً وظيفياً لوظيفة مهندس برمجيات سحابية مشارك.',
      type: 'JOB_OFFER_RECEIVED',
      link: '/student/jobs',
      isRead: false,
    },
  ]);

  console.log('✅ Upvia Database successfully seeded with 100% realistic institutional data!');
  console.log('\n--- DEMO ACCOUNTS (Password: Password123!) ---');
  console.log('Super Admin:          superadmin@upvia.com');
  console.log('University Leadership: leadership@upvia.com');
  console.log('University Admin:     admin.univ@upvia.com');
  console.log('College Dean:         dean.computing@upvia.com');
  console.log('Study Plan Director:  director.plans@upvia.com');
  console.log('Program Coordinator:  coordinator.se@upvia.com');
  console.log('Training Unit:        training.unit@upvia.com');
  console.log('Alumni Unit:          alumni.unit@upvia.com');
  console.log('Company Admin (STC):  company.admin@upvia.com');
  console.log('Recruiter (Elm):      recruiter.elm@upvia.com');
  console.log('Academic Supervisor:  supervisor.academic@upvia.com');
  console.log('Company Supervisor:   supervisor.company@upvia.com');
  console.log('Student (Ziyad):      student@upvia.com');
  console.log('--------------------------------------------\n');

  if (shouldDisconnect) {
    await disconnectDatabase();
  }
};

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
