const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const providers = await prisma.aIProvider.findMany({
      include: { models: true }
    });
    console.log('Providers count:', providers.length);
    console.log(JSON.stringify(providers, null, 2));
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
