export type KnowledgeNote = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  aliases: string[];
  category: string;
  folder: string;
  sectionId: string;
  sectionTitle: string;
  createdAt: string;
  updatedAt: string;
  relativePath: string;
  url: string;
  headings: string[];
  excerpt: string;
  plainText: string;
  readingTime: number;
  related: Array<{
    id: string;
    title: string;
    url: string;
  }>;
};

export type KnowledgeBase = {
  generatedAt: string;
  site: {
    title: string;
    description: string;
  };
  stats: {
    totalNotes: number;
    totalSections: number;
    totalTags: number;
    totalReadingMinutes: number;
  };
  sections: Array<{
    id: string;
    title: string;
    description: string;
    count: number;
  }>;
  tags: Array<{
    name: string;
    count: number;
  }>;
  notes: KnowledgeNote[];
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ModelMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: ModelToolCall[];
};

export type ModelToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ModelToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};
