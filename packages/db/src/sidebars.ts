import { randomUUID } from "node:crypto";

export type SidebarItemType = "document" | "category" | "link";

export interface SidebarRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SidebarItemRecord {
  id: string;
  sidebarId: string;
  parentId: string | null;
  type: SidebarItemType;
  label: string;
  documentId: string | null;
  categoryId: string | null;
  link: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSidebarInput {
  slug: string;
  name: string;
  description?: string;
}

export interface UpdateSidebarInput {
  slug?: string;
  name?: string;
  description?: string;
}

export interface CreateSidebarItemInput {
  sidebarId: string;
  parentId?: string;
  type: SidebarItemType;
  label: string;
  documentId?: string;
  categoryId?: string;
  link?: string;
  order?: number;
}

export interface UpdateSidebarItemInput {
  parentId?: string;
  type?: SidebarItemType;
  label?: string;
  documentId?: string;
  categoryId?: string;
  link?: string;
  order?: number;
}

export interface SidebarStore {
  sidebars: SidebarRecord[];
  items: SidebarItemRecord[];
}

const defaultStore: SidebarStore = {
  sidebars: [],
  items: []
};

function cloneStore(store: SidebarStore): SidebarStore {
  return {
    sidebars: store.sidebars.map((sidebar) => ({ ...sidebar })),
    items: store.items.map((item) => ({ ...item }))
  };
}

function nowIso() {
  return new Date().toISOString();
}

export class InMemorySidebarsRepository {
  private readonly store: SidebarStore;

  constructor(store?: SidebarStore) {
    this.store = store ? cloneStore(store) : cloneStore(defaultStore);
  }

  listSidebars() {
    return [...this.store.sidebars].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  getSidebarById(id: string) {
    return this.store.sidebars.find((sidebar) => sidebar.id === id) ?? null;
  }

  getSidebarBySlug(slug: string) {
    return this.store.sidebars.find((sidebar) => sidebar.slug === slug) ?? null;
  }

  createSidebar(input: CreateSidebarInput) {
    if (this.store.sidebars.some((sidebar) => sidebar.slug === input.slug)) {
      throw new Error("slug already exists");
    }

    const timestamp = nowIso();
    const record: SidebarRecord = {
      id: randomUUID(),
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.store.sidebars.push(record);
    return record;
  }

  updateSidebar(id: string, input: UpdateSidebarInput) {
    const record = this.getSidebarById(id);

    if (!record) {
      throw new Error("sidebar not found");
    }

    if (input.slug && input.slug !== record.slug) {
      const exists = this.store.sidebars.some(
        (sidebar) => sidebar.slug === input.slug && sidebar.id !== id
      );
      if (exists) {
        throw new Error("slug already exists");
      }
    }

    Object.assign(record, {
      slug: input.slug ?? record.slug,
      name: input.name ?? record.name,
      description: input.description ?? record.description,
      updatedAt: nowIso()
    });

    return record;
  }

  deleteSidebar(id: string) {
    const index = this.store.sidebars.findIndex((sidebar) => sidebar.id === id);

    if (index === -1) {
      throw new Error("sidebar not found");
    }

    this.store.items = this.store.items.filter((item) => item.sidebarId !== id);

    const [deleted] = this.store.sidebars.splice(index, 1);
    return deleted;
  }

  listSidebarItems(sidebarId: string) {
    return [...this.store.items]
      .filter((item) => item.sidebarId === sidebarId)
      .sort((a, b) => a.order - b.order);
  }

  getSidebarItemById(id: string) {
    return this.store.items.find((item) => item.id === id) ?? null;
  }

  createSidebarItem(input: CreateSidebarItemInput) {
    const sidebar = this.getSidebarById(input.sidebarId);
    if (!sidebar) {
      throw new Error("sidebar not found");
    }

    if (input.parentId) {
      const parent = this.getSidebarItemById(input.parentId);
      if (!parent || parent.sidebarId !== input.sidebarId) {
        throw new Error("parent item not found");
      }
    }

    const timestamp = nowIso();
    const record: SidebarItemRecord = {
      id: randomUUID(),
      sidebarId: input.sidebarId,
      parentId: input.parentId ?? null,
      type: input.type,
      label: input.label,
      documentId: input.documentId ?? null,
      categoryId: input.categoryId ?? null,
      link: input.link ?? null,
      order: input.order ?? 0,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.store.items.push(record);
    return record;
  }

  updateSidebarItem(id: string, input: UpdateSidebarItemInput) {
    const record = this.getSidebarItemById(id);

    if (!record) {
      throw new Error("sidebar item not found");
    }

    if (input.parentId !== undefined) {
      if (input.parentId === id) {
        throw new Error("item cannot be its own parent");
      }
      if (input.parentId) {
        const parent = this.getSidebarItemById(input.parentId);
        if (!parent || parent.sidebarId !== record.sidebarId) {
          throw new Error("parent item not found");
        }
      }
    }

    Object.assign(record, {
      parentId: input.parentId !== undefined ? input.parentId : record.parentId,
      type: input.type ?? record.type,
      label: input.label ?? record.label,
      documentId:
        input.documentId !== undefined ? input.documentId : record.documentId,
      categoryId:
        input.categoryId !== undefined ? input.categoryId : record.categoryId,
      link: input.link !== undefined ? input.link : record.link,
      order: input.order ?? record.order,
      updatedAt: nowIso()
    });

    return record;
  }

  deleteSidebarItem(id: string) {
    const index = this.store.items.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new Error("sidebar item not found");
    }

    this.store.items = this.store.items.filter((item) => item.parentId !== id);

    const [deleted] = this.store.items.splice(index, 1);
    return deleted;
  }
}

export const sidebarsRepository = new InMemorySidebarsRepository();
