import { tagsRepository } from "@lcc-blog/db/tags";

export function listTags() {
  return tagsRepository.listTags();
}

export function getTagById(id: string) {
  return tagsRepository.getTagById(id);
}
