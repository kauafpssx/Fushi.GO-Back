import type { FastifyReply } from 'fastify';

export function setRefreshCookie(reply: FastifyReply, token: string): void {
  reply.setCookie('refresh_token', token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60,
  });
}

export function clearRefreshCookie(reply: FastifyReply): void {
  reply.setCookie('refresh_token', '', {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 0,
  });
}

export function getRefreshTokenFromRequest(request: any): string | undefined {
  return request.cookies?.refresh_token;
}
