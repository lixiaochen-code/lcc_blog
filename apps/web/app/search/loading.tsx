export default function SearchLoadingPage() {
  return (
    <div className="search-layout">
      <section className="search-panel">
        <h1>搜索</h1>
        <p>正在加载搜索结果...</p>
      </section>
      <section className="empty-card">
        <h2>正在查询</h2>
        <p>正在根据关键词召回文档，请稍候。</p>
      </section>
    </div>
  );
}
