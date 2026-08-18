import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: "demo-org" },
    update: { name: "Demo Org" },
    create: { id: "demo-org", name: "Demo Org", plan: "basic" },
  });

  const event = await prisma.event.upsert({
    where: { id: "demo-event" },
    update: {
      name: "Demo Event",
      themeConfig: { colors: { primary: "#4f46e5" }, logoUrl: null },
    },
    create: {
      id: "demo-event",
      organizationId: org.id,
      name: "Demo Event",
      startDate: new Date(),
      themeConfig: { colors: { primary: "#4f46e5" }, logoUrl: null },
    },
  });

  const template = await prisma.template.upsert({
    where: { id: "demo-template" },
    update: {},
    create: {
      id: "demo-template",
      eventId: event.id,
      layoutJson: { label: "Clásico", type: "frame" },
    },
  });

  console.log(
    `Seeded: org=${org.id} event=${event.id} template=${template.id}`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
