import { documentsRepository } from "@lcc-blog/db/documents";
import { NextResponse } from "next/server";
import { AuthorizationError, requireApiPermission } from "../../../../lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireApiPermission("doc.read");
    const { id } = await context.params;
    const document = documentsRepository.getDocumentById(id);

    if (!document) {
      return NextResponse.json(
        { message: "document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      document,
      versions: documentsRepository.getDocumentVersions(id)
    });
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 500;
    const message = error instanceof Error ? error.message : "get failed";

    return NextResponse.json({ message }, { status });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireApiPermission("doc.update");
    const { id } = await context.params;
    const body = (await request.json()) as {
      slug?: string;
      title?: string;
      summary?: string;
      content?: string;
      status?: "draft" | "review" | "published" | "archived";
      updatedBy?: string;
    };

    const updated = documentsRepository.updateDocument(id, {
      slug: body.slug,
      title: body.title,
      summary: body.summary,
      content: body.content,
      status: body.status,
      updatedBy: body.updatedBy ?? session.user.email ?? "system"
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "update failed" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiPermission("doc.delete");
    const { id } = await context.params;
    const archived = documentsRepository.deleteDocument(
      id,
      session.user.email ?? "system"
    );
    return NextResponse.json(archived);
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 404;
    const message = error instanceof Error ? error.message : "delete failed";

    return NextResponse.json({ message }, { status });
  }
}
