import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../../models';
import { sendPaginated } from '../../utils/response.util';

export class AuditController {
  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 25;
      const entity = req.query.entity as string;
      const action = req.query.action as string;

      const filter: any = {};
      if (entity) filter.entity = entity;
      if (action) filter.action = action;

      const total = await AuditLog.countDocuments(filter);
      const logs = await AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      sendPaginated(res, logs, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
