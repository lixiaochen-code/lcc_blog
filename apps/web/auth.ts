import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authRepository } from "@lcc-blog/db";
import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development"
    ? "local-dev-auth-secret-change-me"
    : undefined);

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret: authSecret,
  session: {
    strategy: "jwt"
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize(credentials: Record<string, unknown>) {
        const email =
          typeof credentials.email === "string" ? credentials.email : "";
        const password =
          typeof credentials.password === "string" ? credentials.password : "";

        const user = authRepository.verifyUserCredentials(email, password);

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          permissions: user.permissions,
          status: user.status
        };
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  callbacks: {
    jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.roles = user.roles;
        token.permissions = user.permissions;
        token.status = user.status;
      }

      return token;
    },
    session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = typeof token.sub === "string" ? token.sub : "";
        session.user.roles = Array.isArray(token.roles)
          ? token.roles.filter(
              (value): value is string => typeof value === "string"
            )
          : [];
        session.user.permissions = Array.isArray(token.permissions)
          ? token.permissions.filter(
              (value): value is string => typeof value === "string"
            )
          : [];
        session.user.status =
          typeof token.status === "string" ? token.status : "active";
      }

      return session;
    }
  }
});
