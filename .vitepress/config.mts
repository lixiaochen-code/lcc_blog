import { defineConfig } from "vitepress";
import { kbNav, kbSidebar } from "./generated/kb.mjs";

export default defineConfig({
  title: "小晨的学习笔记",
  description: "一个可检索、可整理、可持续生长的个人知识库",
  lang: "zh-CN",
  cleanUrls: true,
  ignoreDeadLinks: true,
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
