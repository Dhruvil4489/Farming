/**
 * POST /api/v1/assistant/chat
 *
 * Authenticated endpoint for grounded RAG assistant queries.
 * Validates session, bounds token input, and returns verified decision support.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { getAuthenticatedUser } from '@/lib/auth';
import { AssistantRagService } from '@/services/AssistantRagService';

export const dynamic = 'force-dynamic';

const chatSchema = z.object({
  question: z
    .string()
    .min(1, 'Question cannot be empty')
    .max(2000, 'Question exceeds maximum limit of 2000 characters'),
  fieldId: z.string().optional().nullable(),
  conversationId: z.string().optional().nullable(),
  language: z.enum(['en', 'hi', 'gu']).optional().default('en'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiError('Authentication required to use AI Farming Assistant', 'auth_required', 401);
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = chatSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        'Invalid chat request format',
        'validation_error',
        422,
        parseResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { question, fieldId, conversationId, language } = parseResult.data;

    const result = await AssistantRagService.ask({
      userId: user.id,
      question,
      fieldId: fieldId || null,
      conversationId: conversationId || null,
      language: language as 'en' | 'hi' | 'gu',
    });

    return apiSuccess(result, undefined, 200);
  } catch (error: any) {
    console.error('[API /api/v1/assistant/chat POST] Error:', error.message);
    return apiError(error.message || 'Failed to process assistant query', 'assistant_error', 500);
  }
}
