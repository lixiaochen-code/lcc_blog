import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RuntimeConfigEntity } from "../database/entities/runtime-config.entity";
import { maskApiKey, normalizeRuntimeConfig } from "../common/config-normalizer";
import { RuntimeConfig } from "../common/types";

@Injectable()
export class RuntimeService {
  constructor(@InjectRepository(RuntimeConfigEntity) private readonly runtimeRepo: Repository<RuntimeConfigEntity>) {}

  async getConfig(): Promise<RuntimeConfig> {
    const entity = await this.runtimeRepo.findOne({ where: { id: 1 } });
    if (!entity) throw new BadRequestException("AI runtime config is missing.");
    return normalizeRuntimeConfig(JSON.parse(entity.configJson || "{}"));
  }

  async setConfig(input: Record<string, any>) {
    const current = await this.getConfig();
    const next = normalizeRuntimeConfig(input.platforms ? {
      ...current,
      platforms: input.platforms,
      selection: input.selection || current.selection,
    } : {
      ...current,
      server: {
        ...current.server,
        protocol: input.protocol || current.server.protocol,
        baseUrl: input.baseUrl || current.server.baseUrl,
      },
      model: {
        selected: input.model || current.model.selected,
      },
      credentials: {
        apiKey: input.apiKey || current.credentials.apiKey,
      },
      platforms: current.platforms.map((platform) => platform.id === current.selection.platformId
        ? {
            ...platform,
            protocol: input.protocol || platform.protocol,
            baseUrl: input.baseUrl || platform.baseUrl,
            apiKey: input.apiKey || platform.apiKey,
            models: input.model ? [input.model] : platform.models,
          }
        : platform),
      selection: {
        ...current.selection,
        model: input.model || current.selection.model,
      },
    });

    await this.runtimeRepo.save(this.runtimeRepo.create({
      id: 1,
      configJson: JSON.stringify(next),
      updatedAt: new Date().toISOString(),
    }));
    return next;
  }

  sanitize(config: RuntimeConfig) {
    return {
      ...config,
      platforms: (config.platforms || []).map((platform) => ({
        ...platform,
        apiKey: maskApiKey(platform.apiKey),
      })),
      credentials: {
        ...(config.credentials || {}),
        apiKey: maskApiKey(config.credentials?.apiKey || ""),
      },
    };
  }
}
