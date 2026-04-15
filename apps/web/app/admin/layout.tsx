import type { ReactNode } from "react";
import { headers } from "next/headers";
import { AdminNav } from "../../components/admin-nav";
import { requireAuth } from "../../lib/auth";

export default async function AdminLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await requireAuth();
  const headerList = await headers();
  const currentPath = headerList.get("x-current-path") ?? "/admin";

  return (
    <div className="admin-shell">
      <section className="page-section admin-shell__intro">
        <div className="section-heading">
          <div>
            <h2>后台控制台</h2>
            <p>
              当前登录用户：{session.user.name ?? session.user.email} · 角色：
              {session.user.roles.join(", ")}
            </p>
          </div>
        </div>
        <AdminNav
          currentPath={currentPath}
          permissions={session.user.permissions}
        />
      </section>
      {children}
    </div>
  );
}
