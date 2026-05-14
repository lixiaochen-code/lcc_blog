import { IsString, MinLength } from 'class-validator'

export class LoginDto {
  @IsString({ message: '用户名必填' })
  @MinLength(1, { message: '用户名必填' })
  username!: string

  @IsString({ message: '密码必填' })
  @MinLength(1, { message: '密码必填' })
  password!: string
}
