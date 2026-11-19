import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

async function requireAdmin() {
  const user = await getAuthenticatedUser();
  if (!user) return { error: apiError('Authentication required', 'unauthorized', 401) };
  const isAdmin = user.roles.some((r) => r.role.name === 'ADMIN');
  if (!isAdmin) return { error: apiError('Administrator access required', 'forbidden', 403) };
  return { user };
}

const updateProductSchema = z.object({
  productId: z.string().min(1),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
});

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const products = await prisma.product.findMany({
      include: { brand: true, category: true },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(products);
  } catch (err: any) {
    console.error('Error fetching admin products:', err);
    return apiError('Failed to fetch store products', 'admin_products_error', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await req.json();
    const parsed = updateProductSchema.parse(body);

    const data: any = {};
    if (parsed.price !== undefined) data.price = parsed.price;
    if (parsed.stock !== undefined) data.stock = parsed.stock;
    if (parsed.isAvailable !== undefined) data.isAvailable = parsed.isAvailable;

    const updated = await prisma.product.update({
      where: { id: parsed.productId },
      data,
      include: { brand: true, category: true },
    });

    return apiSuccess(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError(err.issues[0]?.message || 'Validation failed', 'validation_error', 422);
    }
    console.error('Error updating admin product:', err);
    return apiError('Failed to update product', 'admin_product_update_error', 400);
  }
}
