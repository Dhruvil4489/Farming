import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  for (const tbl of ['User', 'Role', 'UserRole', 'AuthToken', 'EmailDeliveryLog', 'NotificationPreference']) {
    const cols = await prisma.$queryRawUnsafe(`PRAGMA table_info("${tbl}")`);
    const idxs = await prisma.$queryRawUnsafe(`PRAGMA index_list("${tbl}")`);
    console.log(`TABLE ${tbl}: cols=[${cols.map((c) => `${c.name}:${c.type}${Number(c.notnull) ? '!' : ''}`).join(', ')}] indexes=[${idxs.map((i) => `${i.name}(u=${i.unique})`).join(', ')}]`);
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      emailVerifiedAt: true,
      createdAt: true,
      _count: { select: { farms: true, orders: true, tasks: true } },
    },
  });
  console.log(`\nExisting Users (${users.length}):`);
  for (const u of users) {
    console.log(` - ${u.name} | email=${u.email || 'NULL'} | phone=${u.phone || 'NULL'} | verified=${Boolean(u.emailVerifiedAt)} | farms=${u._count.farms} orders=${u._count.orders} tasks=${u._count.tasks}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
