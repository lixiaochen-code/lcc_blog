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

const processes = [];

if (await isPortInUse(AI_DEV_PORT)) {
  console.log(`[ai-dev-server] detected existing server on http://localhost:${AI_DEV_PORT}, reusing it.`);
} else {
  processes.push(start("ai-dev-server", process.execPath, ["./scripts/dev/ai-dev-server.mjs"]));
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
