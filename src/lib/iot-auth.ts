/**
 * SmartFarm AI — IoT Device Authentication & Token Security Utility
 *
 * Security Policies:
 * 1. Tokens are never stored in plaintext. Only SHA-256 hashes are persisted in `IotDevice.tokenHash`.
 * 2. Tokens are evaluated in constant time using `crypto.timingSafeEqual` where applicable.
 * 3. Inactive/revoked devices are denied access with HTTP 403 Forbidden.
 * 4. Tokens are never printed in logs or included in client API responses after initial provisioning.
 * 5. Device ownership (farm/field) is strictly resolved from the database registry, never from request payloads.
 */

import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';
import { prisma } from './prisma';
import type { IotDevice } from '@prisma/client';

export interface DeviceAuthResult {
  authenticated: boolean;
  device?: IotDevice;
  reason?: 'missing_token' | 'invalid_token' | 'device_revoked' | 'internal_error';
  status?: number;
  message?: string;
}

/**
 * Generates a cryptographically strong device bearer token.
 * Format: sf_dev_<64-character-hex>
 */
export function generateDeviceToken(): string {
  return `sf_dev_${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Computes a standard SHA-256 digest of the raw device bearer token.
 */
export function hashDeviceToken(rawToken: string): string {
  if (typeof rawToken !== 'string' || rawToken.trim().length === 0) {
    throw new Error('Token must be a non-empty string');
  }
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
}

/**
 * Compares two token hashes using constant-time comparison to prevent timing attacks.
 */
export function constantTimeHashCompare(hashA: string, hashB: string): boolean {
  if (typeof hashA !== 'string' || typeof hashB !== 'string') return false;
  const bufA = Buffer.from(hashA, 'utf-8');
  const bufB = Buffer.from(hashB, 'utf-8');
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Authenticates an incoming IoT telemetry request.
 * Resolves the device record strictly by matching the SHA-256 hash of the provided bearer token.
 */
export async function authenticateDevice(request: Request | NextRequest): Promise<DeviceAuthResult> {
  try {
    let providedToken: string | null = null;

    // 1. Check Authorization: Bearer <token>
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) {
        providedToken = match[1].trim();
      }
    }

    // 2. Check fallback custom header: x-device-token
    if (!providedToken) {
      const customHeader = request.headers.get('x-device-token');
      if (customHeader) {
        providedToken = customHeader.trim();
      }
    }

    if (!providedToken) {
      return {
        authenticated: false,
        reason: 'missing_token',
        status: 401,
        message: 'Missing device authentication token. Provide Authorization: Bearer <token>.',
      };
    }

    // 3. Compute hash and query registry
    const computedHash = hashDeviceToken(providedToken);

    const device = await prisma.iotDevice.findFirst({
      where: { tokenHash: computedHash },
      include: {
        field: {
          select: {
            id: true,
            farmId: true,
            name: true,
          },
        },
      },
    });

    if (!device) {
      return {
        authenticated: false,
        reason: 'invalid_token',
        status: 401,
        message: 'Invalid device credentials.',
      };
    }

    // 4. Verify device status
    if (device.status !== 'active') {
      return {
        authenticated: false,
        reason: 'device_revoked',
        status: 403,
        message: `Device is ${device.status}. Telemetry ingestion rejected.`,
      };
    }

    // 5. Update lastSeenAt and lastIp asynchronously
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    await prisma.iotDevice.update({
      where: { id: device.id },
      data: {
        lastSeenAt: new Date(),
        lastIp: clientIp,
      },
    }).catch((err) => {
      console.warn('[IotAuth] Failed to update device lastSeenAt:', err.message);
    });

    return {
      authenticated: true,
      device,
    };
  } catch (error: any) {
    console.error('[IotAuth] Authentication error:', error.message);
    return {
      authenticated: false,
      reason: 'internal_error',
      status: 500,
      message: 'Internal device authentication failure.',
    };
  }
}
