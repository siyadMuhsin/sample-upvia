import { Request, Response, NextFunction } from 'express';
import { Notification, NotificationPreference } from '../../models';
import { sendSuccess } from '../../utils/response.util';
import { BadRequestError } from '../../utils/errors.util';

export class NotificationController {
  async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const notifications = await Notification.find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();
      sendSuccess(res, notifications);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { isRead: true, readAt: new Date() },
        { new: true }
      );
      sendSuccess(res, notification, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      await Notification.updateMany(
        { userId: req.user.userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      sendSuccess(res, null, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
