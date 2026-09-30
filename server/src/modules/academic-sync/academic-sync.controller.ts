import { Request, Response, NextFunction } from 'express';
import { academicIntegrationService } from './academic-sync.service';
import { sendSuccess } from '../../utils/response.util';

export class AcademicSyncController {
  async triggerSync(req: Request, res: Response, next: NextFunction) {
    try {
      const { syncType = 'FULL' } = req.body;
      const log = await academicIntegrationService.executeSync(syncType, req.user?.userId);
      sendSuccess(res, log, `Academic synchronization completed with status: ${log.status}`);
    } catch (error) {
      next(error);
    }
  }

  async getSyncLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await academicIntegrationService.getSyncHistory();
      sendSuccess(res, logs);
    } catch (error) {
      next(error);
    }
  }
}

export const academicSyncController = new AcademicSyncController();
