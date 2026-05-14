import { IsArray, IsIn, IsOptional, IsString } from 'class-validator'
import { PERMISSIONS, type Permission } from '../../common/permissions'

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsArray()
  @IsIn(PERMISSIONS as readonly string[], { each: true, message: '存在未知权限项' })
  permissions?: Permission[]
}
