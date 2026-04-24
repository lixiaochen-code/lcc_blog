import Link from "next/link";
import { getCurrentSession } from "../lib/auth";
import { SiteNav } from "./site-nav";

export async function SiteHeader() {
  const session = await getCurrentSession();

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-brand" href="/">
          <strong>AI 驱动知识平台</strong>
          <span>文档站、知识库与 AI 协作壳体</span>
        </Link>
        <SiteNav isSignedIn={Boolean(session?.user?.id)} />
      </div>
    </header>
  );
}
