import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator'

export class UpdateMcpServerDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsIn(['http'])
  type?: 'http'

  @IsOptional()
  @IsString()
  endpoint?: string

  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}
