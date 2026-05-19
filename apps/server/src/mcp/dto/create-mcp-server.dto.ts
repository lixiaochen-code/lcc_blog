import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateMcpServerDto {
  @IsString({ message: '名称必填' })
  @MinLength(1, { message: '名称必填' })
  name!: string

  @IsIn(['http'], { message: 'type 仅支持 http' })
  type!: 'http'

  @IsString({ message: 'endpoint 必须是字符串' })
  endpoint!: string

  @IsOptional()
  @IsBoolean({ message: 'enabled 必须是布尔值' })
  enabled?: boolean
}
