import { randomUUID } from "node:crypto";

export interface TagRecord {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagInput {
  slug: string;
  name: string;
}

export interface UpdateTagInput {
  slug?: string;
  name?: string;
}

export interface TagStore {
  tags: TagRecord[];
}

const defaultStore: TagStore = {
  tags: []
};

function cloneStore(store: TagStore): TagStore {
  return {
    tags: store.tags.map((tag) => ({ ...tag }))
  };
}

function nowIso() {
  return new Date().toISOString();
}

export class InMemoryTagsRepository {
  private readonly store: TagStore;

  constructor(store?: TagStore) {
    this.store = store ? cloneStore(store) : cloneStore(defaultStore);
  }

  listTags() {
    return [...this.store.tags].sort((a, b) => a.name.localeCompare(b.name));
  }

  getTagById(id: string) {
    return this.store.tags.find((tag) => tag.id === id) ?? null;
  }

  getTagBySlug(slug: string) {
    return this.store.tags.find((tag) => tag.slug === slug) ?? null;
  }

  createTag(input: CreateTagInput) {
    if (this.store.tags.some((tag) => tag.slug === input.slug)) {
      throw new Error("slug already exists");
    }

    const timestamp = nowIso();
    const record: TagRecord = {
      id: randomUUID(),
      slug: input.slug,
      name: input.name,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.store.tags.push(record);
    return record;
  }

  updateTag(id: string, input: UpdateTagInput) {
    const record = this.getTagById(id);

    if (!record) {
      throw new Error("tag not found");
    }

    if (input.slug && input.slug !== record.slug) {
      const exists = this.store.tags.some(
        (tag) => tag.slug === input.slug && tag.id !== id
      );
      if (exists) {
        throw new Error("slug already exists");
      }
    }

    Object.assign(record, {
      slug: input.slug ?? record.slug,
      name: input.name ?? record.name,
      updatedAt: nowIso()
    });

    return record;
  }

  deleteTag(id: string) {
    const index = this.store.tags.findIndex((tag) => tag.id === id);

    if (index === -1) {
      throw new Error("tag not found");
    }

    const [deleted] = this.store.tags.splice(index, 1);
    return deleted;
  }
}

export const tagsRepository = new InMemoryTagsRepository();
