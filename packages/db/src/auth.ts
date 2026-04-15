import { createHash, randomUUID } from "node:crypto";
import {
  defaultRolePermissions,
  permissionCodes,
  roleCodes,
  type PermissionCode,
  type RoleCode
} from "@lcc-blog/shared";

export type UserStatus = "active" | "disabled";

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RoleRecord {
  id: string;
  code: RoleCode;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionRecord {
  id: string;
  code: PermissionCode;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserRoleRecord {
  userId: string;
  roleId: string;
  assignedAt: string;
}

export interface RolePermissionRecord {
  roleId: string;
  permissionId: string;
  assignedAt: string;
}

export interface AuthStore {
  users: UserRecord[];
  roles: RoleRecord[];
  permissions: PermissionRecord[];
  userRoles: UserRoleRecord[];
  rolePermissions: RolePermissionRecord[];
}

export interface CreateUserInput {
  email: string;
  name?: string;
  password: string;
  status?: UserStatus;
  roleCodes?: RoleCode[];
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  status: UserStatus;
  roles: RoleCode[];
  permissions: PermissionCode[];
}

function nowIso() {
  return new Date().toISOString();
}

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function titleizeCode(code: string) {
  return code
    .split(/[._]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildDefaultStore(): AuthStore {
  const timestamp = new Date("2026-04-15T00:00:00.000Z").toISOString();

  const roles: RoleRecord[] = roleCodes.map((code: RoleCode) => ({
    id: `role_${code}`,
    code,
    name: titleizeCode(code),
    description: `${code} role`,
    createdAt: timestamp,
    updatedAt: timestamp
  }));

  const permissions: PermissionRecord[] = permissionCodes.map(
    (code: PermissionCode) => ({
      id: `perm_${code.replace(/[^a-z0-9]+/gi, "_")}`,
      code,
      name: titleizeCode(code),
      description: `${code} permission`,
      createdAt: timestamp,
      updatedAt: timestamp
    })
  );

  const roleByCode = new Map(roles.map((role) => [role.code, role]));
  const permissionByCode = new Map(
    permissions.map((permission) => [permission.code, permission])
  );

  const rolePermissions: RolePermissionRecord[] = (
    Object.entries(defaultRolePermissions) as Array<
      [Exclude<RoleCode, "guest">, PermissionCode[]]
    >
  ).flatMap(([roleCode, codes]) => {
    const role = roleByCode.get(roleCode as Exclude<RoleCode, "guest">);

    if (!role) {
      return [];
    }

    return codes.flatMap((permissionCode) => {
      const permission = permissionByCode.get(permissionCode);

      if (!permission) {
        return [];
      }

      return {
        roleId: role.id,
        permissionId: permission.id,
        assignedAt: timestamp
      };
    });
  });

  const users: UserRecord[] = [
    {
      id: "user_admin_seed",
      email: "admin@example.com",
      name: "Admin",
      passwordHash: hashPassword("admin123"),
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "user_editor_seed",
      email: "user@example.com",
      name: "User",
      passwordHash: hashPassword("user123"),
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ];

  const userRoles: UserRoleRecord[] = [
    {
      userId: "user_admin_seed",
      roleId: roleByCode.get("admin")?.id ?? "role_admin",
      assignedAt: timestamp
    },
    {
      userId: "user_editor_seed",
      roleId: roleByCode.get("user")?.id ?? "role_user",
      assignedAt: timestamp
    }
  ];

  return {
    users,
    roles,
    permissions,
    userRoles,
    rolePermissions
  };
}

function cloneStore(store: AuthStore): AuthStore {
  return {
    users: store.users.map((user) => ({ ...user })),
    roles: store.roles.map((role) => ({ ...role })),
    permissions: store.permissions.map((permission) => ({ ...permission })),
    userRoles: store.userRoles.map((record) => ({ ...record })),
    rolePermissions: store.rolePermissions.map((record) => ({ ...record }))
  };
}

export class InMemoryAuthRepository {
  private readonly store: AuthStore;

  constructor(store?: AuthStore) {
    this.store = store ? cloneStore(store) : buildDefaultStore();
  }

  listUsers() {
    return [...this.store.users].sort((a, b) => a.email.localeCompare(b.email));
  }

  listRoles() {
    return [...this.store.roles].sort((a, b) => a.code.localeCompare(b.code));
  }

  listPermissions() {
    return [...this.store.permissions].sort((a, b) =>
      a.code.localeCompare(b.code)
    );
  }

  getUserByEmail(email: string) {
    return this.store.users.find((user) => user.email === email) ?? null;
  }

  getUserById(id: string) {
    return this.store.users.find((user) => user.id === id) ?? null;
  }

  createUser(input: CreateUserInput) {
    const email = input.email.trim().toLowerCase();

    if (this.getUserByEmail(email)) {
      throw new Error("user already exists");
    }

    const timestamp = nowIso();
    const record: UserRecord = {
      id: randomUUID(),
      email,
      name: input.name ?? null,
      passwordHash: hashPassword(input.password),
      status: input.status ?? "active",
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.store.users.push(record);

    const roleCodesToAssign = input.roleCodes?.length
      ? input.roleCodes
      : ["user"];
    for (const roleCode of roleCodesToAssign) {
      const role = this.store.roles.find(
        (candidate) => candidate.code === roleCode
      );

      if (!role) {
        throw new Error(`role not found: ${roleCode}`);
      }

      this.store.userRoles.push({
        userId: record.id,
        roleId: role.id,
        assignedAt: timestamp
      });
    }

    return record;
  }

  verifyUserCredentials(email: string, password: string) {
    const user = this.getUserByEmail(email.trim().toLowerCase());

    if (!user || user.status !== "active") {
      return null;
    }

    if (user.passwordHash !== hashPassword(password)) {
      return null;
    }

    return this.getAuthenticatedUser(user.id);
  }

  getAuthenticatedUser(userId: string): AuthenticatedUser | null {
    const user = this.getUserById(userId);

    if (!user) {
      return null;
    }

    const roleIds = this.store.userRoles
      .filter((record) => record.userId === user.id)
      .map((record) => record.roleId);

    const roles = this.store.roles
      .filter((role) => roleIds.includes(role.id))
      .map((role) => role.code);

    const permissionIds = this.store.rolePermissions
      .filter((record) => roleIds.includes(record.roleId))
      .map((record) => record.permissionId);

    const permissions = this.store.permissions
      .filter((permission) => permissionIds.includes(permission.id))
      .map((permission) => permission.code)
      .filter((code, index, array) => array.indexOf(code) === index);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      roles,
      permissions
    };
  }
}

export function createRBACSeedSnapshot() {
  return buildDefaultStore();
}

export const authRepository = new InMemoryAuthRepository();
