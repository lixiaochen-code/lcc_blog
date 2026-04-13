import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import KnowledgeDashboard from "./components/KnowledgeDashboard.vue";
import AiWorkbench from "./components/AiWorkbench.vue";
import NoteExplorer from "./components/NoteExplorer.vue";
import "./global.less";

const theme: Theme = {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component("KnowledgeDashboard", KnowledgeDashboard);
    app.component("AiWorkbench", AiWorkbench);
    app.component("NoteExplorer", NoteExplorer);
  },
};

export default theme;
