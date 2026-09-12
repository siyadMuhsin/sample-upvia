import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/environment';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/error.middleware';
import { User } from './models';
import { runSeed } from './seed';

// Module Routes
import authRoutes from './modules/auth/auth.routes';
import universityRoutes from './modules/universities/university.routes';
import studentRoutes from './modules/students/student.routes';
import companyRoutes from './modules/companies/company.routes';
import opportunityRoutes from './modules/opportunities/opportunity.routes';
import applicationRoutes from './modules/applications/application.routes';
import matchingRoutes from './modules/matching/matching.routes';
import trainingRoutes from './modules/training/training.routes';
import evaluationRoutes from './modules/evaluations/evaluation.routes';
import jobOfferRoutes from './modules/job-offers/job-offer.routes';
import graduateRoutes from './modules/graduates/graduate.routes';
import skillRoutes from './modules/skills/skill.routes';
import courseRoutes from './modules/courses/course.routes';
import studyPlanRoutes from './modules/study-plans/study-plan.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import dashboardRoutes from './modules/dashboards/dashboard.routes';
import reportRoutes from './modules/reports/report.routes';
import earlyWarningRoutes from './modules/early-warnings/early-warning.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import auditRoutes from './modules/audit/audit.routes';
import academicSyncRoutes from './modules/academic-sync/academic-sync.routes';
import fileRoutes from './modules/files/file.routes';

const app = express();

// Security & Utility Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});
app.use('/api', apiLimiter);

// Health Check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API v1 Routes
const api = express.Router();

api.use('/auth', authRoutes);
api.use('/academic', universityRoutes);
api.use('/students', studentRoutes);
api.use('/companies', companyRoutes);
api.use('/opportunities', opportunityRoutes);
api.use('/applications', applicationRoutes);
api.use('/matching', matchingRoutes);
api.use('/training', trainingRoutes);
api.use('/evaluations', evaluationRoutes);
api.use('/job-offers', jobOfferRoutes);
api.use('/graduates', graduateRoutes);
api.use('/skills', skillRoutes);
api.use('/courses', courseRoutes);
api.use('/study-plans', studyPlanRoutes);
api.use('/analytics', analyticsRoutes);
api.use('/dashboards', dashboardRoutes);
api.use('/reports', reportRoutes);
api.use('/early-warnings', earlyWarningRoutes);
api.use('/notifications', notificationRoutes);
api.use('/audit', auditRoutes);
api.use('/academic-sync', academicSyncRoutes);
api.use('/files', fileRoutes);

// On-demand Seed Endpoint for initial setup or testing resets
api.all('/seed', async (_req, res) => {
  try {
    console.log('[Seed API] Running on-demand institutional seeding...');
    await runSeed(false);
    res.status(200).json({ success: true, message: 'Database successfully seeded with realistic demo data' });
  } catch (err: any) {
    console.error('[Seed API] Seeding error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.use(ENV.API_PREFIX, api);

// Central Error Handler
app.use(errorHandler);

// Server Startup
export const startServer = async () => {
  await connectDatabase();

  // Auto-seed if database has 0 users
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Database is empty. Auto-seeding realistic institutional dataset...');
      await runSeed(false);
      console.log('✅ Auto-seeding complete.');
    } else {
      console.log(`[Database] Found ${userCount} existing users. Database ready.`);
    }
  } catch (seedErr) {
    console.warn('[Database] Auto-seeding check failed:', seedErr);
  }

  const server = app.listen(ENV.PORT, () => {
    console.log(`🚀 Upvia Backend API Server running on port ${ENV.PORT}`);
    console.log(`🌐 Base URL: http://localhost:${ENV.PORT}${ENV.API_PREFIX}`);
  });
  return server;
};

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Fatal Server Startup Error:', err);
    process.exit(1);
  });
}

export default app;
