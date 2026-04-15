import { categoriesRepository } from "@lcc-blog/db/categories";

export function listCategories() {
  return categoriesRepository.listCategories();
}

export function getCategoryById(id: string) {
  return categoriesRepository.getCategoryById(id);
}
