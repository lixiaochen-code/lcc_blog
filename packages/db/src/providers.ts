export interface ProviderConfigRecord {
  id: string;
  name: string;
  label: string;
  enabled: boolean;
  isDefault: boolean;
  defaultModel: string;
}

export interface TextGenerationResult {
  text: string;
  providerName: string;
  model: string;
}

export interface GenerateTextInput {
  prompt: string;
  mode: "search" | "ask" | "summarize";
}

const defaultProviders: ProviderConfigRecord[] = [
  {
    id: "provider_local_echo",
    name: "local-knowledge",
    label: "Local Knowledge Provider",
    enabled: true,
    isDefault: true,
    defaultModel: "kb-summarizer-v1"
  }
];

export class InMemoryProviderRegistry {
  private readonly providers: ProviderConfigRecord[];

  constructor(providers?: ProviderConfigRecord[]) {
    this.providers = (providers ?? defaultProviders).map((provider) => ({
      ...provider
    }));
  }

  listProviders() {
    return this.providers.map((provider) => ({ ...provider }));
  }

  getDefaultProvider() {
    return (
      this.providers.find(
        (provider) => provider.enabled && provider.isDefault
      ) ??
      this.providers.find((provider) => provider.enabled) ??
      null
    );
  }
}

function buildModeLead(mode: GenerateTextInput["mode"]) {
  switch (mode) {
    case "search":
      return "基于知识库召回结果，下面是与问题最相关的信息：";
    case "summarize":
      return "基于知识库内容，下面是简要摘要：";
    case "ask":
    default:
      return "基于知识库上下文，下面是回答：";
  }
}

export async function generateTextWithDefaultProvider(
  input: GenerateTextInput
): Promise<TextGenerationResult> {
  const provider = providerRegistry.getDefaultProvider();

  if (!provider) {
    throw new Error("default provider is not configured");
  }

  const cleanedPrompt = input.prompt
    .replace(/\s+/g, " ")
    .replace(/Context:/i, "")
    .trim();

  return {
    text: `${buildModeLead(input.mode)} ${cleanedPrompt}`.trim(),
    providerName: provider.name,
    model: provider.defaultModel
  };
}

export const providerRegistry = new InMemoryProviderRegistry();
