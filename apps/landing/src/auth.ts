import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { getServerEnv } from "./lib/env.server";

const credentialsSchema = z.object({
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
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
