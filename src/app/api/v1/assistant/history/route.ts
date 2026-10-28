/**
 * GET /api/v1/assistant/history
 *
 * Lists conversation threads and recent messages for the authenticated farmer.
 * Strictly tenant-isolated by user.id.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiError('Authentication required to view conversation history', 'auth_required', 401);
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    const conversations = await prisma.assistantConversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20,
        },
      },
    });

    return apiSuccess({ conversations });
  } catch (error: any) {
    console.error('[API /api/v1/assistant/history GET] Error:', error.message);
    return apiError(error.message || 'Failed to retrieve conversation history', 'history_error', 500);
  }
}
