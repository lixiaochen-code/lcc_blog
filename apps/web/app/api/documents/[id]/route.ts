import { documentsRepository } from "@lcc-blog/db/documents";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
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
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    slug?: string;
    title?: string;
    summary?: string;
    content?: string;
    status?: "draft" | "review" | "published" | "archived";
    updatedBy?: string;
  };

  try {
    const updated = documentsRepository.updateDocument(id, {
      slug: body.slug,
      title: body.title,
      summary: body.summary,
      content: body.content,
      status: body.status,
      updatedBy: body.updatedBy ?? "admin"
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
  const { id } = await context.params;

  try {
    const archived = documentsRepository.deleteDocument(id, "admin");
    return NextResponse.json(archived);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "delete failed" },
      { status: 404 }
    );
  }
}
