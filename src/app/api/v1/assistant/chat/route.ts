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
    .max(4000, 'Question exceeds maximum limit of 4000 characters')
    .optional()
    .default(''),
  fieldId: z.string().optional().nullable(),
  conversationId: z.string().optional().nullable(),
  language: z.enum(['en', 'hi', 'gu']).optional().default('en'),
  image: z.string().optional().nullable(),
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

    const { question, fieldId, conversationId, language, image } = parseResult.data;

    if (!question.trim() && !image) {
      return apiError('Question or crop image is required', 'validation_error', 422, {
        question: ['Question cannot be empty unless an image is attached.'],
      });
    }

    const result = await AssistantRagService.ask({
      userId: user.id,
      question: question.trim() || 'What is wrong with my plant? Please analyze this image.',
      fieldId: fieldId || null,
      conversationId: conversationId || null,
      language: language as 'en' | 'hi' | 'gu',
      image: image || null,
    });

    return apiSuccess(result, undefined, 200);
  } catch (error: any) {
    console.error('[API /api/v1/assistant/chat POST] Error:', error.message);
    return apiError(error.message || 'Failed to process assistant query', 'assistant_error', 500);
  }
}
