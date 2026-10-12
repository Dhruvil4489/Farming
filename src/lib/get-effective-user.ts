import { getAuthenticatedUser } from './auth';
import { prisma } from './prisma';

export async function getEffectiveUserId(): Promise<string | null> {
  const authUser = await getAuthenticatedUser();
  if (authUser) {
    return authUser.id;
  }

  // In development / demo environment, fallback to demo farmer for guest checkout & cart preview
  const demoFarmer = await prisma.user.findFirst({
    where: { email: 'farmer@smartfarm.ai' },
  });

  return demoFarmer ? demoFarmer.id : null;
}
