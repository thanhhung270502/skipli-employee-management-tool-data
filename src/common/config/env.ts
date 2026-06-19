const REQUIRED_ENV = ['JWT_SECRET'] as const;

const PRODUCTION_ENV = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'SENDGRID_API_KEY',
  'SENDGRID_FROM_EMAIL',
  'FRONTEND_URL',
] as const;

export const validateEnv = (): void => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    const prodMissing = PRODUCTION_ENV.filter((key) => !process.env[key]?.trim());

    if (prodMissing.length > 0) {
      console.error(
        `❌ Missing required production environment variables: ${prodMissing.join(', ')}`
      );
      process.exit(1);
    }
  }
};
