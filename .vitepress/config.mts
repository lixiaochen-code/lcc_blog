import { defineConfig } from "vitepress";
import { kbNav, kbSidebar } from "./generated/kb.mjs";

export default defineConfig({
  title: "LCC Knowledge Lab",
  description: "重新构建的 Markdown-first 个人知识库与 AI 工作台",
  lang: "zh-CN",
  cleanUrls: true,
  ignoreDeadLinks: true,
  head: [["meta", { name: "theme-color", content: "#d86c2a" }]],
  themeConfig: {
    nav: kbNav,
    sidebar: kbSidebar,
    search: {
      provider: "local",
    },
    outline: {
      level: [2, 3],
      label: "本页目录",
    },
    docFooter: {
      prev: "上一篇",
      next: "下一篇",
    },
    socialLinks: [{ icon: "github", link: "https://github.com/lixiaochen-code/lcc_blog" }],
  },
});
