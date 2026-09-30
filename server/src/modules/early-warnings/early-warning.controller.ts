import { Request, Response, NextFunction } from 'express';
import { earlyWarningService } from './early-warning.service';
import { AlertRule } from '../../models';
import { sendSuccess } from '../../utils/response.util';

export class EarlyWarningController {
  async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const { severity, category } = req.query;
      const filter: any = {};
      if (severity) filter.severity = severity;
      if (category) filter.category = category;

      const alerts = await earlyWarningService.getActiveAlerts(filter);
      sendSuccess(res, alerts);
    } catch (error) {
      next(error);
    }
  }

  async runRuleEvaluation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await earlyWarningService.evaluateAllRules();
      sendSuccess(res, result, `Evaluated early warning rules. Created ${result.createdCount} new alerts.`);
    } catch (error) {
      next(error);
    }
  }

  async resolveAlert(req: Request, res: Response, next: NextFunction) {
    try {
      const alert = await earlyWarningService.resolveAlert(req.params.id, req.user?.userId || '');
      sendSuccess(res, alert, 'Alert resolved');
    } catch (error) {
      next(error);
    }
  }

  async getRules(req: Request, res: Response, next: NextFunction) {
    try {
      const rules = await AlertRule.find().lean();
      sendSuccess(res, rules);
    } catch (error) {
      next(error);
    }
  }
}

export const earlyWarningController = new EarlyWarningController();
