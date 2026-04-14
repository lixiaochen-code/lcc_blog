import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="error-layout">
      <section className="error-card">
        <h1>页面不存在</h1>
        <p>当前请求的页面还没有对应内容，或者该文档样例尚未加入站点壳体。</p>
        <Link className="button-link button-link--primary" href="/docs">
          返回文档中心
        </Link>
      </section>
    </div>
  );
}
