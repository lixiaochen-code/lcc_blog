import { documentsRepository } from "@lcc-blog/db/documents";

export function listDocuments() {
  return documentsRepository.listDocuments();
}

export function getDocumentById(id: string) {
  return documentsRepository.getDocumentById(id);
}

export function getDocumentVersions(id: string) {
  return documentsRepository.getDocumentVersions(id);
}
