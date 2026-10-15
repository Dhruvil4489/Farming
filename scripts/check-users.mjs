import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      state: true,
      district: true,
      isDemo: true,
      passwordHash: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
      deletedAt: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  console.log(`Total users found: ${users.length}`);
  for (const u of users) {
    console.log({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      hasHash: !!u.passwordHash,
      hashPrefix: u.passwordHash ? u.passwordHash.slice(0, 10) + '...' : null,
      isDemo: u.isDemo,
      emailVerifiedAt: u.emailVerifiedAt,
      phoneVerifiedAt: u.phoneVerifiedAt,
      roles: u.roles.map((r) => r.role.name),
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    });
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
