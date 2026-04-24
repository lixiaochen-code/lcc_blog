export type AppRuntime = "dev" | "prod";

export const APP_RUNTIMES: readonly AppRuntime[] = ["dev", "prod"];

export const DEFAULTE_AI_KEY = "sk-sRgS3LcPfcN2ETm58";
export const DEFAULTE_AI_BASE_URL = "http://127.0.0.1:8317/v1";
export const DEFAULTE_AI_MODEL = "gpt-5.4";

export interface ProviderConfigRecord {
  id: string;
  name: string;
  label: string;
  runtime: AppRuntime;
  enabled: boolean;
  isDefault: boolean;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
}

export type PublicProviderConfigRecord = Omit<
  ProviderConfigRecord,
  "apiKey"
> & {
  apiKeyMasked: string;
};

export interface TextGenerationResult {
  text: string;
  providerName: string;
  model: string;
}

export interface GenerateTextInput {
  prompt: string;
  mode: "search" | "ask" | "summarize";
}

export const defaultAppRuntime: AppRuntime =
  process.env.NODE_ENV === "production" ? "prod" : "dev";

export const defaultAiConfigByRuntime: Record<
  AppRuntime,
  {
    apiKey: string;
    baseUrl: string;
    model: string;
  }
> = {
  dev: {
    apiKey: DEFAULTE_AI_KEY,
    baseUrl: DEFAULTE_AI_BASE_URL,
    model: DEFAULTE_AI_MODEL
  },
  prod: {
    apiKey: DEFAULTE_AI_KEY,
    baseUrl: DEFAULTE_AI_BASE_URL,
    model: DEFAULTE_AI_MODEL
  }
};

function createDefaultProvider(runtime: AppRuntime): ProviderConfigRecord {
  const config = defaultAiConfigByRuntime[runtime];

  return {
    id: `provider_default_${runtime}`,
    name: "default-ai",
    label: "Default AI Provider",
    runtime,
    enabled: true,
    isDefault: true,
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    defaultModel: config.model
  };
}

const defaultProviders: ProviderConfigRecord[] = APP_RUNTIMES.map((runtime) => ({
  ...createDefaultProvider(runtime),
  isDefault: runtime === defaultAppRuntime
}));

function maskApiKey(apiKey: string) {
  if (apiKey.length <= 8) {
    return "********";
  }

  return `${apiKey.slice(0, 5)}...${apiKey.slice(-4)}`;
}

function toPublicProvider(
  provider: ProviderConfigRecord
): PublicProviderConfigRecord {
  const safeProvider = { ...provider };
  delete (safeProvider as Partial<ProviderConfigRecord>).apiKey;

  return {
    ...(safeProvider as Omit<ProviderConfigRecord, "apiKey">),
    apiKeyMasked: maskApiKey(provider.apiKey)
  };
}

export class InMemoryProviderRegistry {
  private readonly providers: ProviderConfigRecord[];

  constructor(providers?: ProviderConfigRecord[]) {
    this.providers = (providers ?? defaultProviders).map((provider) => ({
      ...provider
    }));
  }

  listProviders() {
    return this.providers.map((provider) => toPublicProvider(provider));
  }

  getDefaultProvider(runtime: AppRuntime = defaultAppRuntime) {
    return (
      this.providers.find(
        (provider) =>
          provider.runtime === runtime && provider.enabled && provider.isDefault
      ) ??
      this.providers.find(
        (provider) => provider.runtime === runtime && provider.enabled
      ) ??
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
