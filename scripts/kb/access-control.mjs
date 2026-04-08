import path from "node:path";
import { dataDir, ensureDir, parseArgs, readJson, writeJson } from "./shared.mjs";

const templatePath = path.join(dataDir, "ai-access.example.json");
const localPath = path.join(dataDir, "ai-access.local.json");
const validRoles = new Set(["super_admin", "admin"]);
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

function normalizeRole(role) {
  const normalized = String(role || "").trim().toLowerCase();

  if (normalized === "owner") {
    return "super_admin";
  }

  if (["editor", "viewer", "admin"].includes(normalized)) {
    return "admin";
  }

  if (normalized === "super_admin") {
    return "super_admin";
  }

  return normalized;
}

function printAndExit(payload, code = 0) {
  console.log(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}

function defaultConfig() {
  return {
    meta: {
      version: 1,
      inviteOnly: true,
      superAdminApprovalRequired: true,
      description: "Super-admin managed access control for the production AI tool.",
    },
    users: [],
  };
}

function loadConfig() {
  const rawConfig = readJson(localPath, readJson(templatePath, defaultConfig())) || defaultConfig();
  return normalizeConfig(rawConfig);
}

function saveConfig(config) {
  ensureDir(dataDir);
  writeJson(localPath, config);
}

function ensureRole(role) {
  const normalized = normalizeRole(role);
  if (!validRoles.has(normalized)) {
    throw new Error(`Unsupported role: ${role}`);
  }
  return normalized;
}

function createDefaultQuota() {
  return {
    dailyRequests: 20,
    monthlyTokens: 200000,
  };
}

function generateUserId(name, config) {
  const base = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const prefix = base || "user";
  let nextId = `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

  while (config.users.some((user) => user.id === nextId)) {
    nextId = `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
  }

  return nextId;
}

function ensureUser(config, userId) {
  const user = config.users.find((item) => item.id === userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }
  return user;
}

function normalizeUser(user) {
  const rawRole = String(user.role || "admin").trim().toLowerCase();
  const normalizedRole = ensureRole(rawRole === "suspended" ? "admin" : rawRole);
  const normalizedStatus =
    rawRole === "suspended" || String(user.status || "active").trim().toLowerCase() === "suspended"
      ? "suspended"
      : "active";
  const manualPermissions = Array.isArray(user.permissions) ? user.permissions : [];

  return {
    ...user,
    role: normalizedRole,
    status: normalizedStatus,
    permissions: Array.from(new Set([...(defaultPermissionsByRole[normalizedRole] || []), ...manualPermissions])).sort(),
    quota: user.quota || createDefaultQuota(),
  };
}

function normalizeConfig(config) {
  return {
    meta: {
      ...defaultConfig().meta,
      ...(config.meta || {}),
      ownerApprovalRequired: undefined,
      superAdminApprovalRequired:
        config.meta?.superAdminApprovalRequired ?? config.meta?.ownerApprovalRequired ?? true,
    },
    users: Array.isArray(config.users) ? config.users.map(normalizeUser) : [],
  };
}

function syncPermissionsForRole(user) {
  const implicitPermissions = defaultPermissionsByRole[user.role] || [];
  const manualPermissions = Array.isArray(user.permissions) ? user.permissions : [];
  user.permissions = Array.from(new Set([...implicitPermissions, ...manualPermissions])).sort();
}

function inspectConfig(args) {
  const config = loadConfig();
  const includeUsers = String(args.users || "true").trim().toLowerCase() !== "false";

  printAndExit({
    ok: true,
    source: readJson(localPath, null) ? path.relative(process.cwd(), localPath) : path.relative(process.cwd(), templatePath),
    meta: config.meta,
    totalUsers: config.users.length,
    users: includeUsers ? config.users : undefined,
  });
}

function addUser(args) {
  const config = loadConfig();
  const name = String(args.name || "").trim();
  const role = ensureRole(args.role || "admin");
  const id = String(args.id || generateUserId(name, config)).trim();

  if (!name) {
    throw new Error("add-user requires --name.");
  }

  if (config.users.some((user) => user.id === id)) {
    throw new Error(`User already exists: ${id}`);
  }

  const user = {
    id,
    name,
    role,
    status: "active",
    permissions: [...defaultPermissionsByRole[role]],
    quota: createDefaultQuota(),
    approvedBy: String(args.approvedBy || "super_admin").trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  config.users.push(user);
  saveConfig(config);

  printAndExit({
    ok: true,
    action: "add-user",
    user,
    path: path.relative(process.cwd(), localPath),
  });
}

function deleteUser(args) {
  const config = loadConfig();
  const id = String(args.id || "").trim();

  if (!id) {
    throw new Error("delete-user requires --id.");
  }

  const index = config.users.findIndex((user) => user.id === id);
  if (index === -1) {
    throw new Error(`User not found: ${id}`);
  }

  const [user] = config.users.splice(index, 1);
  saveConfig(config);

  printAndExit({
    ok: true,
    action: "delete-user",
    user,
  });
}

function setRole(args) {
  const config = loadConfig();
  const id = String(args.id || "").trim();
  const role = ensureRole(args.role);
  const user = ensureUser(config, id);

  user.role = role;
  user.status = "active";
  user.permissions = [...defaultPermissionsByRole[role]];
  user.updatedAt = new Date().toISOString();
  saveConfig(config);

  printAndExit({
    ok: true,
    action: "set-role",
    user,
  });
}

function grantPermission(args) {
  const config = loadConfig();
  const id = String(args.id || "").trim();
  const permission = String(args.permission || "").trim();

  if (!permission) {
    throw new Error("grant requires --permission.");
  }

  const user = ensureUser(config, id);
  user.permissions = Array.from(new Set([...(user.permissions || []), permission])).sort();
  user.updatedAt = new Date().toISOString();
  saveConfig(config);

  printAndExit({
    ok: true,
    action: "grant",
    user,
  });
}

function revokePermission(args) {
  const config = loadConfig();
  const id = String(args.id || "").trim();
  const permission = String(args.permission || "").trim();

  if (!permission) {
    throw new Error("revoke requires --permission.");
  }

  const user = ensureUser(config, id);
  user.permissions = (user.permissions || []).filter((item) => item !== permission);
  user.updatedAt = new Date().toISOString();
  saveConfig(config);

  printAndExit({
    ok: true,
    action: "revoke",
    user,
  });
}

function setQuota(args) {
  const config = loadConfig();
  const id = String(args.id || "").trim();
  const user = ensureUser(config, id);
  const dailyRequests = Number(args.dailyRequests);
  const monthlyTokens = Number(args.monthlyTokens);

  user.quota ||= createDefaultQuota();

  if (Number.isFinite(dailyRequests) && dailyRequests >= 0) {
    user.quota.dailyRequests = dailyRequests;
  }

  if (Number.isFinite(monthlyTokens) && monthlyTokens >= 0) {
    user.quota.monthlyTokens = monthlyTokens;
  }

  user.updatedAt = new Date().toISOString();
  saveConfig(config);

  printAndExit({
    ok: true,
    action: "set-quota",
    user,
  });
}

function setStatus(args, status) {
  const config = loadConfig();
  const id = String(args.id || "").trim();
  const user = ensureUser(config, id);

  user.status = status;
  if (status === "suspended") {
    user.permissions = user.permissions.filter((permission) => permission === "tokens.use");
  } else {
    syncPermissionsForRole(user);
  }
  user.updatedAt = new Date().toISOString();
  saveConfig(config);

  printAndExit({
    ok: true,
    action: status === "suspended" ? "suspend" : "activate",
    user,
  });
}

const args = parseArgs(process.argv.slice(2));
const action = String(args.action || "inspect").trim();

try {
  if (action === "inspect") {
    inspectConfig(args);
  }

  if (action === "add-user") {
    addUser(args);
  }

  if (action === "set-role") {
    setRole(args);
  }

  if (action === "delete-user") {
    deleteUser(args);
  }

  if (action === "grant") {
    grantPermission(args);
  }

  if (action === "revoke") {
    revokePermission(args);
  }

  if (action === "set-quota") {
    setQuota(args);
  }

  if (action === "suspend") {
    setStatus(args, "suspended");
  }

  if (action === "activate") {
    setStatus(args, "active");
  }

  printAndExit(
    {
      ok: false,
      error: `Unsupported action: ${action}`,
      supportedActions: ["inspect", "add-user", "delete-user", "set-role", "grant", "revoke", "set-quota", "suspend", "activate"],
    },
    1
  );
} catch (error) {
  printAndExit(
    {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown access control error.",
    },
    1
  );
}
