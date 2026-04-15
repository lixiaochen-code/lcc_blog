import { documentsRepository } from "@lcc-blog/db/documents";
import { NextResponse } from "next/server";
import {
  AuthorizationError,
  requireApiPermission
} from "../../../../../lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiPermission("doc.publish");
    const { id } = await context.params;

    return NextResponse.json(
      documentsRepository.publishDocument(id, session.user.email ?? "system")
    );
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 404;
    const message = error instanceof Error ? error.message : "publish failed";

    return NextResponse.json({ message }, { status });
  }
}
