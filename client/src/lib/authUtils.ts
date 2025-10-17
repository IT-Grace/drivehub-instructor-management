// Auth utility functions for handling unauthorized errors
// Referenced from javascript_log_in_with_replit blueprint

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}
