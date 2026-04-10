import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { AuthModule } from "../auth/auth.module";
import { AccessModule } from "../access/access.module";
import { RuntimeModule } from "../runtime/runtime.module";
import { KbModule } from "../kb/kb.module";

@Module({
  imports: [AuthModule, AccessModule, RuntimeModule, KbModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
