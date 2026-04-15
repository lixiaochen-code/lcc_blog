import { randomUUID } from "node:crypto";

export interface CategoryRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  slug: string;
  name: string;
  description?: string;
}

export interface UpdateCategoryInput {
  slug?: string;
  name?: string;
  description?: string;
}

export interface CategoryStore {
  categories: CategoryRecord[];
}

const defaultStore: CategoryStore = {
  categories: []
};

function cloneStore(store: CategoryStore): CategoryStore {
  return {
    categories: store.categories.map((category) => ({ ...category }))
  };
}

function nowIso() {
  return new Date().toISOString();
}

export class InMemoryCategoriesRepository {
  private readonly store: CategoryStore;

  constructor(store?: CategoryStore) {
    this.store = store ? cloneStore(store) : cloneStore(defaultStore);
  }

  listCategories() {
    return [...this.store.categories].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  getCategoryById(id: string) {
    return this.store.categories.find((category) => category.id === id) ?? null;
  }

  getCategoryBySlug(slug: string) {
    return (
      this.store.categories.find((category) => category.slug === slug) ?? null
    );
  }

  createCategory(input: CreateCategoryInput) {
    if (
      this.store.categories.some((category) => category.slug === input.slug)
    ) {
      throw new Error("slug already exists");
    }

    const timestamp = nowIso();
    const record: CategoryRecord = {
      id: randomUUID(),
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.store.categories.push(record);
    return record;
  }

  updateCategory(id: string, input: UpdateCategoryInput) {
    const record = this.getCategoryById(id);

    if (!record) {
      throw new Error("category not found");
    }

    if (input.slug && input.slug !== record.slug) {
      const exists = this.store.categories.some(
        (category) => category.slug === input.slug && category.id !== id
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

  deleteCategory(id: string) {
    const index = this.store.categories.findIndex(
      (category) => category.id === id
    );

    if (index === -1) {
      throw new Error("category not found");
    }

    const [deleted] = this.store.categories.splice(index, 1);
    return deleted;
  }
}

export const categoriesRepository = new InMemoryCategoriesRepository();
