function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function parseCorsOrigins(value: string): string | string[] {
  if (!value.includes(';') && !value.includes(',')) {
    return value;
  }

  return value
    .split(/[;,]/)
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export const env = {
  port: Number(process.env.PORT) || 8300,
  host: process.env.IP || '::',
  corsOrigin: parseCorsOrigins(requireEnv('CORS_ORIGIN')),
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
