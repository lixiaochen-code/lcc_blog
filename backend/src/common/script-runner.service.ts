import path from "node:path";
import { spawnSync } from "node:child_process";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ScriptRunnerService {
  runNodeScript(relativeScriptPath: string, args: string[] = []) {
    const result = spawnSync(process.execPath, [path.join(process.cwd(), relativeScriptPath), ...args], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    const stdout = String(result.stdout || "").trim();
    const stderr = String(result.stderr || "").trim();
    let payload: any = null;

    if (stdout) {
      try {
        payload = JSON.parse(stdout);
      } catch {
        payload = { ok: result.status === 0, raw: stdout };
      }
    }

    return {
      ok: result.status === 0,
      status: result.status ?? 1,
      payload,
      stderr,
    };
  }

  buildArgs(record: Record<string, unknown> = {}) {
    return Object.entries(record).flatMap(([key, value]) => {
      if (value === undefined || value === null || value === "") return [];
      return [`--${key}`, String(value)];
    });
  }
}
