export type RuntimePlatform = {
  id: string;
  name: string;
  protocol: "http" | "https";
  baseUrl: string;
  apiKey: string;
  models: string[];
};

export type RuntimeConfig = {
  meta?: Record<string, unknown>;
  auth?: Record<string, unknown>;
  platforms: RuntimePlatform[];
  selection: {
    platformId: string;
    model: string;
  };
  permissions?: Record<string, unknown>;
  server: {
    mode: "direct";
    protocol: "http" | "https";
    baseUrl: string;
  };
  model: {
    selected: string;
  };
  credentials: {
    apiKey: string;
  };
};

export type AccessUser = {
  id: string;
  name: string;
  role: "super_admin" | "admin";
  status: "active" | "suspended";
  permissions: string[];
  quota: {
    dailyRequests: number;
    monthlyTokens: number;
  };
  approvedBy: string;
  createdAt: string;
  updatedAt: string;
};
