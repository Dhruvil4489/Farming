import { clearAuthCookie, TOKEN_NAME } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-envelope';

export async function POST() {
  await clearAuthCookie();

  const response = apiSuccess({ message: 'Logged out successfully' });

  // Invalidate cookie on response headers for complete browser coverage
  response.cookies.set(TOKEN_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
