import { UserRole } from '@upvia/shared';
import { AuditLog } from '../models';

export interface AuditEventParams {
  actorId?: any;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  previousStatus?: string;
  newStatus?: string;
  comment?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export const logAuditEvent = async (params: AuditEventParams): Promise<void> => {
  try {
    await AuditLog.create({
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      previousStatus: params.previousStatus,
      newStatus: params.newStatus,
      comment: params.comment,
      details: params.details,
      ipAddress: params.ipAddress,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[AuditLog Error]: Failed to create audit log entry:', error);
  }
};
