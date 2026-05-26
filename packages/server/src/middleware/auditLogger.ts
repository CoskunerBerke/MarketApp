import { AuthRequest } from '../types';

export const auditLogAction = (req: AuthRequest, action: string, status: 'success' | 'failure', details?: string) => {
  // Extract user info
  const userId = req.user?._id ? String(req.user._id) : (req.body?.email ? `Email: ${req.body.email}` : undefined);
  const role = req.user?.role || 'None';
  const method = req.method;
  const endpoint = req.originalUrl || req.url;
  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const timestamp = new Date().toISOString();
  
  // Format details to avoid logging sensitive data
  let cleanDetails = details;
  if (cleanDetails) {
    cleanDetails = cleanDetails
      .replace(/("password"|"passwordHash"|"token"|"apiKey"|"x-api-key")\s*:\s*"[^"]*"/gi, '$1:"[REDACTED]"');
  }

  console.log(
    `[AUDIT] ${timestamp} - User: ${userId || 'Anonymous'} - Role: ${role} - Action: ${action} - Method: ${method} - Route: ${endpoint} - IP: ${ip} - User-Agent: ${userAgent} - Status: ${status}${cleanDetails ? ` - Details: ${cleanDetails}` : ''}`
  );
};
