import path from "node:path";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { AccessModule } from "./access/access.module";
import { RuntimeModule } from "./runtime/runtime.module";
import { ChatModule } from "./chat/chat.module";
import { KbModule } from "./kb/kb.module";
import { UserEntity } from "./database/entities/user.entity";
import { SessionEntity } from "./database/entities/session.entity";
import { RuntimeConfigEntity } from "./database/entities/runtime-config.entity";
import { BootstrapService } from "./database/bootstrap.service";
import { AppController } from "./app.controller";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "sqljs",
      location: path.join(process.cwd(), "data", "backend.sqlite"),
      autoSave: true,
      entities: [UserEntity, SessionEntity, RuntimeConfigEntity],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([UserEntity, SessionEntity, RuntimeConfigEntity]),
    AuthModule,
    AccessModule,
    RuntimeModule,
    ChatModule,
    KbModule,
  ],
  controllers: [AppController],
  providers: [BootstrapService],
})
export class AppModule {}
