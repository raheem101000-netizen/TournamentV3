// =============================================================================
// SKYVIEW + OPENTELEMETRY — DORMANT (no-op stubs)
// To re-enable: restore the original implementation from skyview.ts.bak
// =============================================================================

// Kept for reference — original config constants (unused while dormant)
// const ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://46.62.229.59:4319';
// const API_KEY  = process.env.SKYVIEW_API_KEY || '...';
// const SERVICE_NAME = 'tourni-app';
// const TENANT_ID    = 'Tourni1010';

// --- IMPORTANT ROUTES TO TRACE (preserved for when re-enabled) ---
export const IMPORTANT_ROUTES: string[] = [
  'POST /api/auth/login',
  'POST /api/auth/register',
  'POST /api/auth/logout',
  'POST /api/auth/resend-verification',
  'PATCH /api/users/:id',
  'POST /api/users/:id/password',
  'POST /api/users/:id/disable',
  'DELETE /api/users/:id',
  'POST /api/tournaments',
  'PATCH /api/tournaments/:id',
  'DELETE /api/tournaments/:id',
  'POST /api/tournaments/:tournamentId/generate-fixtures',
  'POST /api/tournaments/:tournamentId/matches/custom',
  'POST /api/tournaments/:tournamentId/registrations',
  'POST /api/tournaments/:tournamentId/registration-config',
  'PUT /api/tournaments/:id/registration/config',
  'PATCH /api/matches/:id',
  'DELETE /api/matches/:id',
  'POST /api/matches/:matchId/winner',
  'DELETE /api/matches/:matchId/participants/:participantId',
  'POST /api/servers',
  'PATCH /api/servers/:id',
  'DELETE /api/servers/:id',
  'POST /api/servers/:serverId/join',
  'POST /api/servers/:serverId/channels',
  'DELETE /api/servers/:serverId/members/:userId',
  'POST /api/teams',
  'PATCH /api/teams/:id',
  'PATCH /api/teams/:id/members/:memberId',
  'POST /api/team-members',
  'DELETE /api/team-members/:id',
  'POST /api/team-profiles',
  'PATCH /api/team-profiles/:id',
  'PATCH /api/registrations/:id',
  'POST /api/achievements',
  'POST /api/poster-templates',
  'PATCH /api/poster-templates/:id',
  'DELETE /api/poster-templates/:id',
];

export function shouldTrace(_routeName: string): boolean {
  return false;
}

export function startTrace(
  _name: string,
  _parentContext?: { traceId: string; parentSpanId: string },
  _userContext?: { userId?: string; username?: string }
): string {
  return '';
}

export function endTrace(_status: 'OK' | 'ERROR' = 'OK'): void {
  // no-op
}

export function log(
  _level: 'INFO' | 'WARN' | 'ERROR',
  _message: string,
  _attrs?: Record<string, any>
): void {
  // no-op
}

export function metric(_name: string, _value: number): void {
  // no-op
}

export async function flush(): Promise<void> {
  // no-op
}

export function skyviewErrorHandler(err: any, _req: any, _res: any, next: any): void {
  next(err);
}

export function skyviewResponseTracker(_req: any, _res: any, next: any): void {
  next();
}

export function logError(_error: Error, _context?: Record<string, any>): void {
  // no-op
}

export function initGlobalErrorTracking(): void {
  // no-op — skyview dormant
}
