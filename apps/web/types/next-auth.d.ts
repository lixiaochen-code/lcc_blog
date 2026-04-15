import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      roles: string[];
      permissions: string[];
      status: string;
    };
  }

  interface User {
    roles: string[];
    permissions: string[];
    status: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[];
    permissions?: string[];
    status?: string;
  }
}
