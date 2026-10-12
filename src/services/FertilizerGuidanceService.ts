import { prisma } from '@/lib/prisma';

export class FertilizerGuidanceService {
  static async getCategories() {
    return prisma.fertilizerCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { guidances: true },
        },
      },
    });
  }

  static async getCategoryBySlug(slug: string) {
    return prisma.fertilizerCategory.findUnique({
      where: { slug },
      include: {
        guidances: true,
      },
    });
  }

  static async getGuidance(params: {
    crop?: string;
    stage?: string;
    categorySlug?: string;
  }) {
    const where: any = {};

    if (params.crop) {
      where.cropSlug = params.crop.toLowerCase();
    }
    if (params.stage) {
      where.cropStage = { contains: params.stage };
    }
    if (params.categorySlug) {
      where.fertilizerCategory = { slug: params.categorySlug };
    }

    return prisma.cropFertilizerGuidance.findMany({
      where,
      include: {
        fertilizerCategory: true,
      },
      orderBy: [{ cropName: 'asc' }, { recommendedTiming: 'asc' }],
    });
  }
}
