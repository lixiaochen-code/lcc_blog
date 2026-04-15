import Link from "next/link";
import type { SidebarItemRecord } from "@lcc-blog/db/sidebars";

interface SidebarTreeProps {
  items: SidebarItemRecord[];
  currentSlug?: string;
}

function buildTree(items: SidebarItemRecord[]): SidebarItemRecord[] {
  const itemMap = new Map<
    string,
    SidebarItemRecord & { children: SidebarItemRecord[] }
  >();

  items.forEach((item) => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  const roots: (SidebarItemRecord & { children: SidebarItemRecord[] })[] = [];

  items.forEach((item) => {
    const node = itemMap.get(item.id)!;
    if (item.parentId) {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function SidebarNode({
  item,
  currentSlug
}: {
  item: SidebarItemRecord & { children?: SidebarItemRecord[] };
  currentSlug?: string;
}) {
  let href = "#";
  let isActive = false;

  if (item.type === "document" && item.documentId) {
    href = `/docs/${item.documentId}`;
    isActive = currentSlug === item.documentId;
  } else if (item.type === "link" && item.link) {
    href = item.link;
  }

  return (
    <li>
      {item.type === "category" ? (
        <span>{item.label}</span>
      ) : (
        <Link href={href} data-active={isActive}>
          {item.label}
        </Link>
      )}
      {item.children && item.children.length > 0 && (
        <ul>
          {item.children.map((child) => (
            <SidebarNode
              key={child.id}
              item={child}
              currentSlug={currentSlug}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function SidebarTree({ items, currentSlug }: SidebarTreeProps) {
  const tree = buildTree(items);

  if (tree.length === 0) {
    return <p>暂无目录项</p>;
  }

  return (
    <ul>
      {tree.map((item) => (
        <SidebarNode key={item.id} item={item} currentSlug={currentSlug} />
      ))}
    </ul>
  );
}
