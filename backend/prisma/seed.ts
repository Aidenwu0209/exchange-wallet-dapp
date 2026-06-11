import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.blockScanState.upsert({
    where: { chainId: Number(process.env.CHAIN_ID ?? 31337) },
    update: {},
    create: {
      chainId: Number(process.env.CHAIN_ID ?? 31337),
      lastScannedBlock: 0,
      requiredConfirmations: Number(process.env.REQUIRED_CONFIRMATIONS ?? 2),
      scannerStatus: "idle"
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
