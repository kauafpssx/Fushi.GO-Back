function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT) || 47291,
  host: process.env.HOST || '0.0.0.0',
  corsOrigin: requireEnv('CORS_ORIGIN'),
  jwtSecret: requireEnv('JWT_SECRET'),
  cittamobiUsername: Buffer.from(requireEnv('CITTAMOB_USERNAME_B64'), 'base64').toString(),
  cittamobiCoreUrl: requireEnv('CITTAMOB_CORE_URL'),
  cittamobiSessionUrl: requireEnv('CITTAMOB_SESSION_URL'),
  upstashRedisUrl: requireEnv('UPSTASH_REDIS_REST_URL'),
  upstashRedisToken: requireEnv('UPSTASH_REDIS_REST_TOKEN'),
  vapidPublicKey: requireEnv('VAPID_PUBLIC_KEY'),
  vapidPrivateKey: requireEnv('VAPID_PRIVATE_KEY'),
  vapidSubject: requireEnv('VAPID_SUBJECT'),
};
