import fs from "node:fs";
import path from "node:path";
import { Controller, Get } from "@nestjs/common";

@Controller("api")
export class AppController {
  @Get("health")
  health() {
    const runtimeLocalPath = path.join(process.cwd(), "data", "ai-runtime.local.json");
    const accessLocalPath = path.join(process.cwd(), "data", "ai-access.local.json");
    return {
      ok: true,
      status: "ready",
      port: Number(process.env.AI_DEV_PORT || 3030),
      runtimeSource: fs.existsSync(runtimeLocalPath) ? "local" : "template",
      accessSource: fs.existsSync(accessLocalPath) ? "local" : "template",
      storage: "sqlite",
    };
  }
}
