"use client";

interface ErrorPageProps {
  error: Error;
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="error-layout">
      <section className="error-card">
        <h1>页面渲染异常</h1>
        <p>{error.message || "发生了未预期错误，请稍后重试。"}</p>
        <button
          className="button-link button-link--primary"
          onClick={reset}
          type="button"
        >
          重试
        </button>
      </section>
    </div>
  );
}
