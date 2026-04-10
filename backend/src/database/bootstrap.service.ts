import fs from "node:fs";
import path from "node:path";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "./entities/user.entity";
import { SessionEntity } from "./entities/session.entity";
import { RuntimeConfigEntity } from "./entities/runtime-config.entity";
import { normalizeRuntimeConfig } from "../common/config-normalizer";

function readJson(filePath: string, fallback: any) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

@Injectable()
export class BootstrapService implements OnModuleInit {
  constructor(
    @InjectRepository(UserEntity) private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(SessionEntity) private readonly sessionsRepo: Repository<SessionEntity>,
    @InjectRepository(RuntimeConfigEntity) private readonly runtimeRepo: Repository<RuntimeConfigEntity>
  ) {}

  async onModuleInit() {
    await this.bootstrapUsers();
    await this.bootstrapSessions();
    await this.bootstrapRuntimeConfig();
  }

  private async bootstrapUsers() {
    if (await this.usersRepo.count()) return;
    const root = process.cwd();
    const accessLocalPath = path.join(root, "data", "ai-access.local.json");
    const accessTemplatePath = path.join(root, "data", "ai-access.example.json");
    const raw = readJson(accessLocalPath, readJson(accessTemplatePath, { users: [] }));
    const users = Array.isArray(raw?.users) ? raw.users : [];
    if (users.length === 0) return;

    const entities = users.map((user: any) => this.usersRepo.create({
      id: String(user.id || "").trim(),
      name: String(user.name || "").trim(),
      role: String(user.role || "admin").trim().toLowerCase() === "super_admin" ? "super_admin" : "admin",
      status: String(user.status || "active").trim().toLowerCase() === "suspended" ? "suspended" : "active",
      permissionsJson: JSON.stringify(Array.isArray(user.permissions) ? user.permissions : []),
      dailyRequests: Number(user?.quota?.dailyRequests || 20),
      monthlyTokens: Number(user?.quota?.monthlyTokens || 200000),
      approvedBy: String(user.approvedBy || "super_admin"),
      createdAt: String(user.createdAt || new Date().toISOString()),
      updatedAt: String(user.updatedAt || new Date().toISOString()),
    }));

    await this.usersRepo.save(entities);
  }

  private async bootstrapSessions() {
    if (await this.sessionsRepo.count()) return;
    const root = process.cwd();
    const sessionsLocalPath = path.join(root, "data", "ai-sessions.local.json");
    const raw = readJson(sessionsLocalPath, { sessions: {} });
    const sessionsRecord = raw?.sessions && typeof raw.sessions === "object" ? raw.sessions : {};
    const now = new Date().toISOString();
    const entities = Object.entries(sessionsRecord)
      .map(([token, userId]) => this.sessionsRepo.create({
        token: String(token),
        userId: String(userId),
        createdAt: now,
      }));
    if (entities.length > 0) {
      await this.sessionsRepo.save(entities);
    }
  }

  private async bootstrapRuntimeConfig() {
    const existing = await this.runtimeRepo.findOne({ where: { id: 1 } });
    if (existing) return;
    const root = process.cwd();
    const runtimeLocalPath = path.join(root, "data", "ai-runtime.local.json");
    const runtimeTemplatePath = path.join(root, "data", "ai-runtime.example.json");
    const raw = readJson(runtimeLocalPath, readJson(runtimeTemplatePath, {}));
    const normalized = normalizeRuntimeConfig(raw || {});
    await this.runtimeRepo.save(this.runtimeRepo.create({
      id: 1,
      configJson: JSON.stringify(normalized),
      updatedAt: new Date().toISOString(),
    }));
  }
}
