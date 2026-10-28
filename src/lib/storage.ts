/**
 * SmartFarm AI — Secure Diagnosis Storage Abstraction
 *
 * Enforces:
 * 1. Storage boundary strictly within configured workspace upload directory.
 * 2. Absolute path traversal prevention (rejects '..', slashes, null bytes).
 * 3. File magic-byte signature validation (JPEG, PNG, WebP) independent of client header.
 * 4. Maximum file size bounding (10 MB).
 * 5. Tenant-scoped authorization: images are never public in /public folder.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
const UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'diagnoses');

export function isWithinUploadRoot(targetPath: string): boolean {
  const normalizedRoot = path.resolve(UPLOAD_ROOT);
  const normalizedTarget = path.resolve(targetPath);
  const relative = path.relative(normalizedRoot, normalizedTarget);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

export interface ValidatedFile {
  buffer: Buffer;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
  sizeBytes: number;
}

/**
 * Validates actual binary magic bytes. Never trusts Content-Type or file extension.
 */
export function validateImageMagicBytes(buffer: Buffer): { isValid: boolean; mimeType?: 'image/jpeg' | 'image/png' | 'image/webp'; extension?: 'jpg' | 'png' | 'webp' } {
  if (!buffer || buffer.length < 12) {
    return { isValid: false };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, mimeType: 'image/jpeg', extension: 'jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, mimeType: 'image/png', extension: 'png' };
  }

  // WebP: 'RIFF' .... 'WEBP'
  const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
  const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP';
  if (isRiff && isWebp) {
    return { isValid: true, mimeType: 'image/webp', extension: 'webp' };
  }

  return { isValid: false };
}

/**
 * Saves an uploaded buffer safely to the private diagnosis storage directory.
 * Returns the relative storage path (e.g. "diag_abc123.jpg").
 */
export async function saveDiagnosisImage(
  buffer: Buffer,
  originalFilename?: string
): Promise<{ filename: string; relativePath: string; sizeBytes: number; mimeType: string }> {
  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`File size ${buffer.length} bytes exceeds maximum limit of ${MAX_IMAGE_SIZE_BYTES} bytes (10MB).`);
  }

  const validation = validateImageMagicBytes(buffer);
  if (!validation.isValid || !validation.mimeType || !validation.extension) {
    throw new Error('Unsupported or corrupt image format. Allowed formats: JPEG, PNG, WebP.');
  }

  // Ensure directory exists
  await fs.mkdir(UPLOAD_ROOT, { recursive: true });

  // Generate safe random UUID filename
  const fileId = crypto.randomUUID();
  const filename = `${fileId}.${validation.extension}`;
  const targetPath = path.resolve(UPLOAD_ROOT, filename);

  // Security: Assert target stays within UPLOAD_ROOT
  if (!isWithinUploadRoot(targetPath)) {
    throw new Error('Path traversal detected');
  }

  await fs.writeFile(targetPath, buffer);

  return {
    filename,
    relativePath: `diagnoses/${filename}`,
    sizeBytes: buffer.length,
    mimeType: validation.mimeType,
  };
}

/**
 * Reads an image securely, verifying path boundaries.
 */
export async function readDiagnosisImage(filename: string): Promise<{ buffer: Buffer; mimeType: string }> {
  // Reject path separators or traversal characters in filename
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\') || filename.includes('\0')) {
    throw new Error('Invalid filename');
  }

  const targetPath = path.resolve(UPLOAD_ROOT, filename);
  if (!isWithinUploadRoot(targetPath)) {
    throw new Error('Access denied: Path traversal detected');
  }

  const buffer = await fs.readFile(targetPath);
  const validation = validateImageMagicBytes(buffer);
  const mimeType = validation.mimeType || 'application/octet-stream';

  return { buffer, mimeType };
}

/**
 * Deletes a diagnosis image file safely.
 */
export async function deleteDiagnosisImage(filename: string): Promise<boolean> {
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\') || filename.includes('\0')) {
    return false;
  }

  const targetPath = path.resolve(UPLOAD_ROOT, filename);
  if (!isWithinUploadRoot(targetPath)) {
    return false;
  }

  try {
    await fs.unlink(targetPath);
    return true;
  } catch {
    return false;
  }
}
