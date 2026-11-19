import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

const createDocSchema = z.object({
  slug: z.string().trim().min(3),
  title: z.string().trim().min(5),
  issuingOrg: z.string().trim().min(2),
  sourceUrl: z.string().url().optional().nullable(),
  publicationDate: z.string().optional().nullable(),
  crop: z.string().trim().optional().nullable(),
  topic: z.string().trim().min(2),
  region: z.string().trim().optional().nullable(),
  language: z.enum(['en', 'hi', 'gu']).default('en'),
  license: z.string().default('Government Open Data / Public Extension'),
  chunks: z
    .array(
      z.object({
        title: z.string().trim().min(2),
        content: z.string().trim().min(20),
        keywords: z.string().trim().min(2),
      })
    )
    .min(1),
});

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    const docs = await prisma.knowledgeDocument.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { chunks: true } } },
    });

    return apiSuccess(docs);
  } catch (err) {
    console.error('[GET /api/v1/admin/knowledge]', err);
    return apiError('Failed to list knowledge base documents.', 'kb_list_failed', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);
    const isAdmin = user.roles.some((r) => r.role.name === 'ADMIN');
    if (!isAdmin) return apiError('Admin role required to update knowledge base.', 'forbidden', 403);

    const body = await req.json();
    const parsed = createDocSchema.parse(body);

    const fullContent = parsed.chunks.map((c) => `${c.title}\n${c.content}`).join('\n\n');
    const checksum = crypto.createHash('sha256').update(fullContent).digest('hex');

    const doc = await prisma.knowledgeDocument.upsert({
      where: { slug: parsed.slug },
      update: {
        title: parsed.title,
        issuingOrg: parsed.issuingOrg,
        sourceUrl: parsed.sourceUrl || null,
        publicationDate: parsed.publicationDate ? new Date(parsed.publicationDate) : null,
        crop: parsed.crop || null,
        topic: parsed.topic,
        region: parsed.region || null,
        language: parsed.language,
        license: parsed.license,
        checksum,
        lastVerifiedAt: new Date(),
        isActive: true,
      },
      create: {
        slug: parsed.slug,
        title: parsed.title,
        issuingOrg: parsed.issuingOrg,
        sourceUrl: parsed.sourceUrl || null,
        publicationDate: parsed.publicationDate ? new Date(parsed.publicationDate) : null,
        crop: parsed.crop || null,
        topic: parsed.topic,
        region: parsed.region || null,
        language: parsed.language,
        license: parsed.license,
        checksum,
        lastVerifiedAt: new Date(),
        isActive: true,
      },
    });

    await prisma.knowledgeChunk.deleteMany({ where: { documentId: doc.id } });
    for (let i = 0; i < parsed.chunks.length; i++) {
      const ch = parsed.chunks[i];
      await prisma.knowledgeChunk.create({
        data: {
          documentId: doc.id,
          chunkIndex: i,
          title: ch.title,
          content: ch.content,
          keywords: ch.keywords,
          tokenCount: Math.ceil(ch.content.split(/\s+/).length * 1.3),
          crop: parsed.crop || null,
          topic: parsed.topic,
          language: parsed.language,
          checksum: crypto.createHash('sha256').update(ch.content).digest('hex'),
        },
      });
    }

    return apiSuccess({ id: doc.id, slug: doc.slug, chunksStored: parsed.chunks.length }, undefined, 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError(err.issues[0]?.message || 'Validation failed', 'validation_failed', 422);
    }
    console.error('[POST /api/v1/admin/knowledge]', err);
    return apiError('Failed to save knowledge document.', 'kb_save_failed', 500);
  }
}
