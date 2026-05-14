import { IsString, MinLength } from 'class-validator'

export class UpsertArticleDto {
  @IsString({ message: '路径必填' })
  @MinLength(1, { message: '路径必填' })
  path!: string

  @IsString({ message: '内容必须为字符串' })
  content!: string
}
