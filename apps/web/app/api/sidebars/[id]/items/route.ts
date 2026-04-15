import { sidebarsRepository } from "@lcc-blog/db/sidebars";
import { NextResponse } from "next/server";
import {
  AuthorizationError,
  requireApiPermission
} from "../../../../../lib/auth";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await requireApiPermission("sidebar.read");
    return NextResponse.json({
      items: sidebarsRepository.listSidebarItems(id)
    });
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "sidebar items request failed";

    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await requireApiPermission("sidebar.update");
    const body = (await request.json()) as {
      parentId?: string;
      type: "document" | "category" | "link";
      label: string;
      documentId?: string;
      categoryId?: string;
      link?: string;
      order?: number;
    };

    const created = sidebarsRepository.createSidebarItem({
      sidebarId: id,
      parentId: body.parentId,
      type: body.type,
      label: body.label,
      documentId: body.documentId,
      categoryId: body.categoryId,
      link: body.link,
      order: body.order
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof Error && error.message === "sidebar not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === "parent item not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
