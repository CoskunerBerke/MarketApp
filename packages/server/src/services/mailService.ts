/**
 * Password reset e-mail delivery.
 *
 * No mail provider is wired up yet, so this only reports that the code could
 * not be delivered. The reset code itself must never be written to the logs or
 * returned to the client; plug an SMTP / transactional e-mail provider in here.
 */
export const sendPasswordResetCode = async (_email: string, _code: string): Promise<boolean> => {
  console.warn('[MAIL] Password reset requested, but no mail provider is configured; the code was not delivered.');
  return false;
};
