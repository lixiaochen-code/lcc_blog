import { sidebarsRepository } from "@lcc-blog/db/sidebars";

export function listSidebars() {
  return sidebarsRepository.listSidebars();
}

export function getSidebarById(id: string) {
  return sidebarsRepository.getSidebarById(id);
}

export function listSidebarItems(sidebarId: string) {
  return sidebarsRepository.listSidebarItems(sidebarId);
}
