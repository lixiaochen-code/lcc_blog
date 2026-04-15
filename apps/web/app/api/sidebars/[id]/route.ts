import { sidebarsRepository } from "@lcc-blog/db/sidebars";
import { NextResponse } from "next/server";
import { AuthorizationError, requireApiPermission } from "../../../../lib/auth";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await requireApiPermission("sidebar.read");
    const sidebar = sidebarsRepository.getSidebarById(id);

    if (!sidebar) {
      return NextResponse.json({ error: "sidebar not found" }, { status: 404 });
    }

    return NextResponse.json(sidebar);
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "sidebar request failed";

    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await requireApiPermission("sidebar.update");
    const body = (await request.json()) as {
      slug?: string;
      name?: string;
      description?: string;
    };

    const updated = sidebarsRepository.updateSidebar(id, body);
    return NextResponse.json(updated);
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
    if (error instanceof Error && error.message === "slug already exists") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await requireApiPermission("sidebar.update");
    const deleted = sidebarsRepository.deleteSidebar(id);
    return NextResponse.json(deleted);
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
    throw error;
  }
}
