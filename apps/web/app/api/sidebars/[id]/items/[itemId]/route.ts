import { sidebarsRepository } from "@lcc-blog/db/sidebars";
import { NextResponse } from "next/server";
import {
  AuthorizationError,
  requireApiPermission
} from "../../../../../../lib/auth";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await context.params;
    await requireApiPermission("sidebar.read");
    const item = sidebarsRepository.getSidebarItemById(itemId);

    if (!item) {
      return NextResponse.json(
        { error: "sidebar item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "sidebar item request failed";

    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await context.params;
    await requireApiPermission("sidebar.update");
    const body = (await request.json()) as {
      parentId?: string;
      type?: "document" | "category" | "link";
      label?: string;
      documentId?: string;
      categoryId?: string;
      link?: string;
      order?: number;
    };

    const updated = sidebarsRepository.updateSidebarItem(itemId, body);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof Error && error.message === "sidebar item not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === "parent item not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (
      error instanceof Error &&
      error.message === "item cannot be its own parent"
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await context.params;
    await requireApiPermission("sidebar.update");
    const deleted = sidebarsRepository.deleteSidebarItem(itemId);
    return NextResponse.json(deleted);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof Error && error.message === "sidebar item not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
