import { Module } from "@nestjs/common";
import { KbController } from "./kb.controller";
import { ScriptRunnerService } from "../common/script-runner.service";
import { AuthModule } from "../auth/auth.module";
import { AccessModule } from "../access/access.module";

@Module({
  imports: [AuthModule, AccessModule],
  controllers: [KbController],
  providers: [ScriptRunnerService],
  exports: [ScriptRunnerService],
})
export class KbModule {}
