import crypto from "node:crypto";
import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SessionEntity } from "../database/entities/session.entity";
import { UserEntity } from "../database/entities/user.entity";
import { AccessUser } from "../common/types";

function parsePermissions(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(SessionEntity) private readonly sessionsRepo: Repository<SessionEntity>,
    @InjectRepository(UserEntity) private readonly usersRepo: Repository<UserEntity>
  ) {}

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

  async findUser(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException(`Unknown user: ${userId}`);
    if (user.status !== "active") throw new BadRequestException(`User is not active: ${userId}`);
    return user;
  }

  async login(userId: string, name: string) {
    const user = await this.findUser(userId);
    if (user.name !== name) throw new BadRequestException("Name and userId do not match.");
    const token = crypto.randomBytes(24).toString("hex");
    await this.sessionsRepo.save(this.sessionsRepo.create({
      token,
      userId: user.id,
      createdAt: new Date().toISOString(),
    }));
    return { token, user: this.toAccessUser(user) };
  }

  async removeSession(token: string) {
    if (!token) return;
    await this.sessionsRepo.delete({ token });
  }

  extractBearerToken(authHeader: string | undefined) {
    const header = String(authHeader || "").trim();
    if (!header.toLowerCase().startsWith("bearer ")) return "";
    return header.slice(7).trim();
  }

  async authenticateByToken(token: string) {
    if (!token) throw new UnauthorizedException("Not authenticated.");
    const session = await this.sessionsRepo.findOne({ where: { token } });
    if (!session) throw new UnauthorizedException("Session expired or invalid.");
    const user = await this.findUser(session.userId);
    return this.toAccessUser(user);
  }
}
