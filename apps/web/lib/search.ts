import type { Session } from "next-auth";
import {
  searchDocuments,
  type SearchDocumentsResult
} from "@lcc-blog/db/search";

export function resolveSearchAccess(session: Session | null | undefined) {
  if (!session?.user?.id) {
    return "guest" as const;
  }

  if (
    session.user.roles.includes("admin") ||
    session.user.roles.includes("super_admin")
  ) {
    return "admin" as const;
  }

  return "member" as const;
}

export function executeSearch(input: {
  query: string;
  page?: number;
  pageSize?: number;
  session?: Session | null;
}): SearchDocumentsResult {
  return searchDocuments({
    query: input.query,
    page: input.page,
    pageSize: input.pageSize,
    access: resolveSearchAccess(input.session)
  });
}
