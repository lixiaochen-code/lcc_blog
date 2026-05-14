import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator'

export class UpdateUserDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[]

  @IsOptional()
  @IsBoolean()
  disabled?: boolean

  @IsOptional()
  @IsBoolean()
  resetPassword?: boolean
}
