export interface DocSummary {
  title: string;
  slug: string[];
  section: string;
  summary: string;
  readingTime: string;
  content: string[];
}

export const navItems = [
  { href: "/", label: "首页" },
  { href: "/docs", label: "文档中心" },
  { href: "/search", label: "搜索" },
  { href: "/ai/search", label: "AI 搜索" }
];

export const docs: DocSummary[] = [
  {
    title: "项目概览",
    slug: ["getting-started", "overview"],
    section: "开始使用",
    summary: "快速理解 AI 驱动知识平台的目标、模块边界和后续演进方向。",
    readingTime: "5 分钟",
    content: [
      "该项目不是普通博客，而是一个面向知识治理和 AI 协作的文档平台。",
      "首轮实现重点是稳定骨架、文档展示壳体和后续接入真实 API 的前端结构。",
      "等内容 CRUD、权限和搜索能力逐步落地后，这里会切换到真实数据来源。"
    ]
  },
  {
    title: "内容治理模型",
    slug: ["content", "governance-model"],
    section: "内容治理",
    summary: "描述草稿、审批、发布、回滚之间的核心约束，用于后续内容流设计。",
    readingTime: "7 分钟",
    content: [
      "内容写入默认走草稿化和变更集路径，避免 AI 直接覆盖已发布内容。",
      "审批、审计和回滚是平台的重要基础能力，不属于可选增强。",
      "该页面目前使用静态示例内容，用于支撑文档布局、目录和文档详情壳体。"
    ]
  },
  {
    title: "AI 检索入口",
    slug: ["ai", "retrieval-entry"],
    section: "AI 能力",
    summary: "解释 AI 搜索与问答在系统中的定位，以及它与关键词搜索的关系。",
    readingTime: "6 分钟",
    content: [
      "AI 检索建立在基础搜索之上，先召回文档，再做回答生成与来源引用。",
      "普通用户可以使用只读 AI 能力，但不能发起写入型 AI 任务。",
      "该站点壳体阶段先保留搜索入口和页面结构，等待后续检索接口接入。"
    ]
  }
];

export function getDocBySlug(slug: string[]) {
  return docs.find((doc) => doc.slug.join("/") === slug.join("/"));
}

export function searchDocs(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return docs;
  }

  return docs.filter((doc) => {
    const haystack = [doc.title, doc.section, doc.summary, ...doc.content]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}
