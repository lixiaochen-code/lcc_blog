import { buildKnowledgeArtifacts } from "./core.mjs";

const knowledgeBase = buildKnowledgeArtifacts();
console.log(
  `Knowledge base rebuilt: ${knowledgeBase.stats.totalNotes} notes, ${knowledgeBase.stats.totalSections} sections.`
);
