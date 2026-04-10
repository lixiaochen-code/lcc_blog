import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RuntimeController } from "./runtime.controller";
import { RuntimeService } from "./runtime.service";
import { RuntimeConfigEntity } from "../database/entities/runtime-config.entity";
import { AuthModule } from "../auth/auth.module";
import { AccessModule } from "../access/access.module";

@Module({
  imports: [TypeOrmModule.forFeature([RuntimeConfigEntity]), AuthModule, AccessModule],
  controllers: [RuntimeController],
  providers: [RuntimeService],
  exports: [RuntimeService],
})
export class RuntimeModule {}
