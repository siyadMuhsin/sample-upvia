import { AcademicSyncLog, Student, Program, Course } from '../../models';

export interface AcademicDataSourceConnector {
  name: string;
  fetchStudents(): Promise<any[]>;
  fetchCourses(): Promise<any[]>;
  fetchPrograms(): Promise<any[]>;
}

export class MockSisConnector implements AcademicDataSourceConnector {
  name = 'Banner_SIS_API';

  async fetchStudents(): Promise<any[]> {
    return [];
  }

  async fetchCourses(): Promise<any[]> {
    return [];
  }

  async fetchPrograms(): Promise<any[]> {
    return [];
  }
}

export class AcademicIntegrationService {
  private connector: AcademicDataSourceConnector;

  constructor(connector?: AcademicDataSourceConnector) {
    this.connector = connector || new MockSisConnector();
  }

  async executeSync(syncType: 'STUDENTS' | 'COURSES' | 'PROGRAMS' | 'GRADES' | 'FULL', triggeredBy?: any) {
    const syncLog = await AcademicSyncLog.create({
      syncType,
      sourceSystem: this.connector.name,
      startedAt: new Date(),
      status: 'RUNNING',
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      syncErrors: [],
      triggeredBy,
    });

    try {
      let recordsProcessed = 0;
      let recordsUpdated = 0;

      if (syncType === 'STUDENTS' || syncType === 'FULL') {
        const students = await Student.find();
        recordsProcessed += students.length;
        recordsUpdated += students.length;
      }

      if (syncType === 'COURSES' || syncType === 'FULL') {
        const courses = await Course.find();
        recordsProcessed += courses.length;
        recordsUpdated += courses.length;
      }

      if (syncType === 'PROGRAMS' || syncType === 'FULL') {
        const programs = await Program.find();
        recordsProcessed += programs.length;
        recordsUpdated += programs.length;
      }

      syncLog.status = 'SUCCESS';
      syncLog.completedAt = new Date();
      syncLog.recordsProcessed = recordsProcessed;
      syncLog.recordsUpdated = recordsUpdated;
      await syncLog.save();

      return syncLog;
    } catch (error: any) {
      syncLog.status = 'FAILED';
      syncLog.completedAt = new Date();
      syncLog.syncErrors.push({ message: error.message });
      await syncLog.save();
      throw error;
    }
  }

  async getSyncHistory(limit = 20) {
    return AcademicSyncLog.find().sort({ startedAt: -1 }).limit(limit).lean();
  }
}

export const academicIntegrationService = new AcademicIntegrationService();
