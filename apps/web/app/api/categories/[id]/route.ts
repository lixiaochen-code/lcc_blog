import { categoriesRepository } from "@lcc-blog/db/categories";
import { NextResponse } from "next/server";
import { AuthorizationError, requireApiPermission } from "../../../../lib/auth";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await requireApiPermission("category.read");
    const category = categoriesRepository.getCategoryById(id);

    if (!category) {
      return NextResponse.json(
        { error: "category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "category request failed";

    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await requireApiPermission("category.manage");
    const body = (await request.json()) as {
      slug?: string;
      name?: string;
      description?: string;
    };

    const updated = categoriesRepository.updateCategory(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof Error && error.message === "category not found") {
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
    await requireApiPermission("category.manage");
    const deleted = categoriesRepository.deleteCategory(id);
    return NextResponse.json(deleted);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof Error && error.message === "category not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
