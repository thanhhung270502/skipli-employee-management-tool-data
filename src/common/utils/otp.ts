import * as admin from 'firebase-admin';

/**
 * Generate a cryptographically random 6-digit OTP
 */
export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Get OTP expiry timestamp (Date object)
 */
export const getOtpExpiry = (): Date => {
  const minutes = parseInt(process.env.OTP_EXPIRY_MINUTES ?? '15', 10);
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Check if OTP has expired
 * @param expiry - Firestore Timestamp or Date
 */
export const isOtpExpired = (expiry: admin.firestore.Timestamp | Date | null | undefined): boolean => {
  if (!expiry) return true;

  const expiryDate =
    expiry instanceof admin.firestore.Timestamp
      ? expiry.toDate()
      : new Date(expiry as Date);

  return new Date() > expiryDate;
};
