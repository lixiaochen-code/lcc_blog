import { IsOptional, IsString, MinLength } from 'class-validator'

export class MoveArticleDto {
  @IsString({ message: 'from 必填' })
  @MinLength(1)
  from!: string

  @IsString({ message: 'to 必填' })
  @MinLength(1)
  to!: string

  @IsOptional()
  @IsString()
  title?: string
}
