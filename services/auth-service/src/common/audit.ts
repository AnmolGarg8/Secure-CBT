export interface AuditLog {
  event: string;
  actorUserId?: string | null;
  targetUserId?: string | null;
  institutionId?: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

export function logAuditEvent(log: Omit<AuditLog, 'timestamp'>) {
  const auditLog: AuditLog = {
    ...log,
    timestamp: new Date().toISOString(),
  };
  // Output as structured JSON to stdout for log aggregators to pick up
  console.log(JSON.stringify(auditLog));
}
