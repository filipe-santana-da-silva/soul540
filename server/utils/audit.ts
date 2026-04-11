import mongoose, { Schema } from 'mongoose';
import { getTenantUnit } from '../middleware/tenant';

const AuditLogSchema = new Schema({
  userId:      { type: String, default: '' },
  userName:    { type: String, default: 'Sistema' },
  userUnit:    { type: String, default: 'main' },
  action:      { type: String, enum: ['create', 'update', 'delete'], required: true },
  resource:    { type: String, required: true },
  resourceId:  { type: String, default: '' },
  description: { type: String, required: true },
  timestamp:   { type: Date, default: () => new Date() },
}, { collection: 'auditlogs', toJSON: { virtuals: true, versionKey: false } });

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ resource: 1, timestamp: -1 });
AuditLogSchema.index({ userUnit: 1, timestamp: -1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

interface AuditParams {
  req: any;
  action: 'create' | 'update' | 'delete';
  resource: string;
  resourceId?: string;
  description: string;
}

export async function logAudit({ req, action, resource, resourceId, description }: AuditParams) {
  try {
    const u = (req as any).user;
    // Use the effective tenant unit (which system the action was performed on),
    // not the user's home unit — this correctly tracks franchise/factory actions
    // done by a main admin.
    const userUnit = getTenantUnit(req) || u?.unit || 'main';
    await AuditLog.create({
      userId:     u?._id?.toString() || u?.userId || '',
      userName:   u?.name || 'Desconhecido',
      userUnit,
      action,
      resource,
      resourceId: resourceId || '',
      description,
    });
  } catch {
    // Never block a request due to audit failure
  }
}
