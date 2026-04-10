import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SessionEntity } from "../database/entities/session.entity";
import { UserEntity } from "../database/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity, UserEntity])],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
