import Link from "next/link";
import { DocCard } from "../components/doc-card";
import { docs } from "../lib/site-data";

export default function HomePage() {
  return (
    <>
      <section className="page-section">
        <div className="hero">
          <div className="hero-card">
            <h1>面向 AI 协作的知识平台壳体</h1>
            <p>
              当前阶段聚焦文档站基础体验，先搭好首页、文档布局、搜索入口和导航结构，
              为后续内容 CRUD、权限系统和 AI 检索能力接入提供稳定前台骨架。
            </p>
            <div className="hero-actions">
              <Link className="button-link button-link--primary" href="/docs">
                浏览文档中心
              </Link>
              <Link
                className="button-link button-link--secondary"
                href="/search"
              >
                打开搜索入口
              </Link>
            </div>
          </div>
          <aside className="hero-card hero-side">
            <div className="section-heading">
              <h2>当前壳体能力</h2>
            </div>
            <div className="stat-grid">
              <div className="stat-item">
                <strong>4</strong>
                <span>基础页面入口</span>
              </div>
              <div className="stat-item">
                <strong>3</strong>
                <span>示例文档</span>
              </div>
              <div className="stat-item">
                <strong>Nextra</strong>
                <span>文档主题基线</span>
              </div>
              <div className="stat-item">
                <strong>Mock</strong>
                <span>静态内容驱动</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading">
          <div>
            <h2>示例文档</h2>
            <p>这些内容仅用于验证布局、卡片、目录和详情页外壳。</p>
          </div>
        </div>
        <div className="card-grid">
          {docs.map((doc) => (
            <DocCard key={doc.slug.join("/")} doc={doc} />
          ))}
        </div>
      </section>
    </>
  );
}
