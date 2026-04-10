import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "../database/entities/user.entity";
import { AccessUser } from "../common/types";

const defaultPermissionsByRole = {
  super_admin: [
    "notes.read",
    "notes.create",
    "notes.update",
    "notes.delete",
    "docs.reorganize",
    "kb.ingest_url",
    "site.build",
    "site.deploy",
    "users.manage",
    "tokens.use",
    "runtime.manage_connection",
    "runtime.manage_model",
    "runtime.manage_secret",
  ],
  admin: ["notes.read", "tokens.use"],
};

function parsePermissions(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeRole(role: string): "super_admin" | "admin" {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "super_admin" || normalized === "owner") return "super_admin";
  return "admin";
}

@Injectable()
export class AccessService {
  constructor(@InjectRepository(UserEntity) private readonly usersRepo: Repository<UserEntity>) {}

  toAccessUser(entity: UserEntity): AccessUser {
    return {
      id: entity.id,
      name: entity.name,
      role: entity.role,
      status: entity.status,
      permissions: parsePermissions(entity.permissionsJson),
      quota: {
        dailyRequests: entity.dailyRequests,
        monthlyTokens: entity.monthlyTokens,
      },
      approvedBy: entity.approvedBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async allUsers() {
    const users = await this.usersRepo.find({ order: { createdAt: "ASC" } });
    return users.map((item) => this.toAccessUser(item));
  }

  ensureSuperAdmin(user: AccessUser) {
    if (user.role !== "super_admin") {
      throw new ForbiddenException("Only super_admin can perform this action.");
    }
  }

  ensurePermission(user: AccessUser, permission: string) {
    if (!(user.permissions || []).includes(permission)) {
      throw new ForbiddenException(`Permission denied for ${user.id}: ${permission}`);
    }
  }

  private async findUserOrThrow(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new BadRequestException(`User not found: ${id}`);
    return user;
  }

  async addUser(input: { name: string; role?: string; approvedBy: string }) {
    const role = normalizeRole(input.role || "admin");
    const idBase = input.name
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "user";

    let id = `${idBase}-${Math.random().toString(36).slice(2, 8)}`;
    while (await this.usersRepo.findOne({ where: { id } })) {
      id = `${idBase}-${Math.random().toString(36).slice(2, 8)}`;
    }

    const now = new Date().toISOString();
    const entity = this.usersRepo.create({
      id,
      name: input.name.trim(),
      role,
      status: "active",
      permissionsJson: JSON.stringify(defaultPermissionsByRole[role]),
      dailyRequests: 20,
      monthlyTokens: 200000,
      approvedBy: input.approvedBy,
      createdAt: now,
      updatedAt: now,
    });
    await this.usersRepo.save(entity);
    return this.toAccessUser(entity);
  }

  async deleteUser(id: string) {
    const user = await this.findUserOrThrow(id);
    await this.usersRepo.delete({ id });
    return this.toAccessUser(user);
  }

  async setRole(id: string, role: string) {
    const user = await this.findUserOrThrow(id);
    const nextRole = normalizeRole(role);
    user.role = nextRole;
    user.status = "active";
    user.permissionsJson = JSON.stringify(defaultPermissionsByRole[nextRole]);
    user.updatedAt = new Date().toISOString();
    await this.usersRepo.save(user);
    return this.toAccessUser(user);
  }

  async grant(id: string, permission: string) {
    const user = await this.findUserOrThrow(id);
    const permissions = new Set(parsePermissions(user.permissionsJson));
    permissions.add(permission);
    user.permissionsJson = JSON.stringify(Array.from(permissions).sort());
    user.updatedAt = new Date().toISOString();
    await this.usersRepo.save(user);
    return this.toAccessUser(user);
  }

  async revoke(id: string, permission: string) {
    const user = await this.findUserOrThrow(id);
    const permissions = parsePermissions(user.permissionsJson).filter((item) => item !== permission);
    user.permissionsJson = JSON.stringify(permissions);
    user.updatedAt = new Date().toISOString();
    await this.usersRepo.save(user);
    return this.toAccessUser(user);
  }

  async setQuota(id: string, dailyRequests: number, monthlyTokens: number) {
    const user = await this.findUserOrThrow(id);
    user.dailyRequests = dailyRequests;
    user.monthlyTokens = monthlyTokens;
    user.updatedAt = new Date().toISOString();
    await this.usersRepo.save(user);
    return this.toAccessUser(user);
  }

  async suspend(id: string) {
    const user = await this.findUserOrThrow(id);
    user.status = "suspended";
    user.updatedAt = new Date().toISOString();
    await this.usersRepo.save(user);
    return this.toAccessUser(user);
  }

  async activate(id: string) {
    const user = await this.findUserOrThrow(id);
    user.status = "active";
    user.updatedAt = new Date().toISOString();
    await this.usersRepo.save(user);
    return this.toAccessUser(user);
  }
}
