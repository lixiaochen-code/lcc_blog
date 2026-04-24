import assert from "node:assert/strict";
import test from "node:test";
import {
  APP_RUNTIMES,
  DEFAULTE_AI_BASE_URL,
  DEFAULTE_AI_MODEL,
  providerRegistry
} from "./providers.js";

test("provider registry includes default dev and prod AI configs", () => {
  const providers = providerRegistry.listProviders();

  assert.deepEqual(
    providers.map((provider) => provider.runtime).sort(),
    [...APP_RUNTIMES].sort()
  );
  assert.equal(
    providers.every((provider) => provider.baseUrl === DEFAULTE_AI_BASE_URL),
    true
  );
  assert.equal(
    providers.every((provider) => provider.defaultModel === DEFAULTE_AI_MODEL),
    true
  );
  assert.equal(
    providers.every((provider) => !("apiKey" in provider)),
    true
  );
  assert.equal(
    providers.every((provider) => provider.apiKeyMasked.includes("...")),
    true
  );
});

test("provider registry resolves runtime-specific default provider", () => {
  assert.equal(providerRegistry.getDefaultProvider("dev")?.runtime, "dev");
  assert.equal(providerRegistry.getDefaultProvider("prod")?.runtime, "prod");
  assert.equal(
    providerRegistry.getDefaultProvider("dev")?.defaultModel,
    DEFAULTE_AI_MODEL
  );
});
