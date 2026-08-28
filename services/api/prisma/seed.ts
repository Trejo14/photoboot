import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_PASSWORD = "password123";

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Seed no disponible en producción");
    process.exit(1);
  }

  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  const freeOrg = await prisma.organization.upsert({
    where: { id: "seed-org-free" },
    update: {},
    create: { id: "seed-org-free", name: "Org Free Test", plan: "basic" },
  });

  const proOrg = await prisma.organization.upsert({
    where: { id: "seed-org-pro" },
    update: {},
    create: { id: "seed-org-pro", name: "Org Pro Test", plan: "pro" },
  });

  const lifetimeOrg = await prisma.organization.upsert({
    where: { id: "seed-org-lifetime" },
    update: {},
    create: { id: "seed-org-lifetime", name: "Org Lifetime Test", plan: "lifetime" },
  });

  const users = [
    {
      email: "free@test.com",
      name: "Usuario Free",
      plan: "free",
      planStatus: "active",
      organizationId: freeOrg.id,
    },
    {
      email: "pro@test.com",
      name: "Usuario Pro",
      plan: "pro",
      planStatus: "active",
      organizationId: proOrg.id,
    },
    {
      email: "lifetime@test.com",
      name: "Usuario Lifetime",
      plan: "lifetime",
      planStatus: "active",
      organizationId: lifetimeOrg.id,
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        plan: userData.plan,
        planStatus: userData.planStatus,
        organizationId: userData.organizationId,
      },
      create: {
        email: userData.email,
        name: userData.name,
        password: passwordHash,
        plan: userData.plan,
        planStatus: userData.planStatus,
        organizationId: userData.organizationId,
      },
    });
    console.log(`  ✓ ${user.email} (${user.plan})`);
  }

  console.log("\n✅ Seed complete!");
  console.log("   Test accounts (password: password123):");
  console.log("   - free@test.com      → plan Free");
  console.log("   - pro@test.com       → plan Pro");
  console.log("   - lifetime@test.com  → plan Lifetime");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
