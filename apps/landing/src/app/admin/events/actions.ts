"use server";

import { adminFetch } from "@/lib/admin-api";

export async function createEvent(data: {
  name: string;
  organizationId: string;
  startDate: string;
  themeConfig: { colors: { primary: string } };
}): Promise<{ id: string }> {
  return adminFetch<{ id: string }>("/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
