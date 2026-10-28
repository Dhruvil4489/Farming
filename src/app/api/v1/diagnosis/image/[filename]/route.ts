/**
 * GET /api/v1/diagnosis/image/[filename]
 *
 * Secure image server for diagnosis leaf images.
 * Enforces:
 * 1. Authentication check.
 * 2. Authorization check: user must own the diagnosis record associated with this file.
 * 3. Path traversal prevention.
 * 4. Cache-Control: private.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { readDiagnosisImage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: { message: 'Authentication required' } }, { status: 401 });
    }

    const { filename } = await params;

    // Reject path traversal characters
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: { message: 'Invalid filename' } }, { status: 400 });
    }

    // Authorization check: Verify user owns a diagnosis referencing this image
    const record = await prisma.cropDiagnosisRecord.findFirst({
      where: {
        userId: user.id,
        imagePath: { contains: filename },
      },
    });

    if (!record) {
      return NextResponse.json({ error: { message: 'Image not found or access denied' } }, { status: 404 });
    }

    const { buffer, mimeType } = await readDiagnosisImage(filename);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message || 'Failed to retrieve image' } }, { status: 500 });
  }
}
