import net from "node:net";
import { spawn } from "node:child_process";

const AI_DEV_PORT = Number(process.env.AI_DEV_PORT || 3030);

function start(label, command, args) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code) => {
    console.log(`[${label}] exited with code ${code ?? 0}`);
    process.exit(code ?? 0);
  });

  return child;
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, "127.0.0.1");
  });
}

async function getHealth(port) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const response = await fetch(`http://localhost:${port}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}

const processes = [];

if (await isPortInUse(AI_DEV_PORT)) {
  const health = await getHealth(AI_DEV_PORT);
  if (health?.storage === "sqlite") {
    console.log(`[ai-dev-server] detected existing NestJS server on http://localhost:${AI_DEV_PORT}, reusing it.`);
  } else {
    console.error(
      `[ai-dev-server] port ${AI_DEV_PORT} is occupied by a non-NestJS or incompatible service. Please stop it and retry.`
    );
    process.exit(1);
  }
} else {
  processes.push(start("ai-dev-server", process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["dev:ai-server"]));
}

processes.push(start("vitepress", process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["docs:dev"]));

function shutdown(signal) {
  for (const child of processes) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
