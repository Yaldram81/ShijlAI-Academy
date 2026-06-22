const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const providers = await prisma.aIProvider.findMany({ include: { models: true } });
  console.log(JSON.stringify(providers, null, 2));
}
check().catch(console.error).finally(() => prisma.$disconnect());
