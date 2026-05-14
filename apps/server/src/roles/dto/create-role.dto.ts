import { IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator'
import { PERMISSIONS, type Permission } from '../../common/permissions'

export class CreateRoleDto {
  @IsString({ message: '名称必填' })
  @MinLength(1, { message: '名称必填' })
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsArray()
  @IsIn(PERMISSIONS as readonly string[], { each: true, message: '存在未知权限项' })
  permissions!: Permission[]
}
