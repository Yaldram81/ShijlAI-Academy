const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addModels() {
  const providers = await prisma.aIProvider.findMany({ include: { models: true } });
  
  for (const provider of providers) {
    if (provider.models.length === 0) {
      console.log(`Adding models for provider ${provider.name} (${provider.id})`);
      
      const models = [
        {
          name: 'Gemini 2.5 Flash',
          slug: 'gemini-2.5-flash',
          modelId: 'gemini-2.5-flash',
          type: 'chat',
          isActive: true,
          isDefault: true,
          inputPricePer1M: 0.15,
          outputPricePer1M: 0.60,
          contextWindow: 1048576,
          maxOutputTokens: 8192,
          supportsVision: true,
          supportsStreaming: true,
          supportsJson: true,
          capabilities: JSON.stringify({ function_calling: true }),
          rpmLimit: 60,
          tpmLimit: 1000000,
          providerId: provider.id
        },
        {
          name: 'Gemini 2.5 Pro',
          slug: 'gemini-2.5-pro',
          modelId: 'gemini-2.5-pro',
          type: 'chat',
          isActive: true,
          isDefault: false,
          inputPricePer1M: 1.25,
          outputPricePer1M: 10.00,
          contextWindow: 1048576,
          maxOutputTokens: 8192,
          supportsVision: true,
          supportsStreaming: true,
          supportsJson: true,
          capabilities: JSON.stringify({ function_calling: true, code_execution: true }),
          rpmLimit: 60,
          tpmLimit: 1000000,
          providerId: provider.id
        }
      ];

      for (const model of models) {
        await prisma.aIModel.create({ data: model });
      }
    }
  }

  // Set default fallback configuration
  const config = await prisma.aIConfiguration.findFirst();
  const firstModel = await prisma.aIModel.findFirst({ where: { isDefault: true } });
  const secondModel = await prisma.aIModel.findFirst({ where: { slug: 'gemini-2.5-pro' } });

  if (firstModel) {
    if (config) {
      await prisma.aIConfiguration.update({
        where: { id: config.id },
        data: {
          defaultProviderId: firstModel.providerId,
          defaultModelId: firstModel.id,
          fallbackProviderId: secondModel ? secondModel.providerId : firstModel.providerId,
          fallbackModelId: secondModel ? secondModel.id : firstModel.id,
        }
      });
    } else {
      await prisma.aIConfiguration.create({
        data: {
          defaultProviderId: firstModel.providerId,
          defaultModelId: firstModel.id,
          fallbackProviderId: secondModel ? secondModel.providerId : firstModel.providerId,
          fallbackModelId: secondModel ? secondModel.id : firstModel.id,
        }
      });
    }
  }

  console.log("Done adding models and setting default config.");
}

addModels().catch(console.error).finally(() => prisma.$disconnect());
