import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { getServerEnv } from "./lib/env.server";

const credentialsSchema = z.object({
  password: z.string().min(1),
});

// In-memory since this runs as a single container, not serverless — resets
// on redeploy, which is fine for a login-attempt throttle.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 60_000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_LOGIN_ATTEMPTS;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials, request) => {
        const ip =
          request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          "unknown";
        if (isRateLimited(ip)) return null;

        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        if (parsed.data.password === getServerEnv().ADMIN_PASSWORD) {
          return { id: "operator", name: "Operador" };
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
});
