import { ArrayNotEmpty, IsArray, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateUserDto {
  @IsString({ message: '用户名必填' })
  @MinLength(1, { message: '用户名必填' })
  username!: string

  @IsOptional()
  @IsString()
  @MinLength(8, { message: '密码至少 8 位' })
  password?: string

  @IsArray({ message: 'roleIds 必须是数组' })
  @ArrayNotEmpty({ message: '至少选择一个角色' })
  @IsString({ each: true })
  roleIds!: string[]
}
