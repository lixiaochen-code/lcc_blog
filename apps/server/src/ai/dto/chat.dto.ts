import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

export class ChatHistoryItemDto {
  @IsString({ message: 'history.role 必须是字符串' })
  role!: string

  @IsString({ message: 'history.content 必须是字符串' })
  content!: string
}

export class ChatRequestDto {
  @IsString({ message: 'message 必须是字符串' })
  @MinLength(1, { message: 'message 不能为空' })
  message!: string

  @IsOptional()
  @IsString({ message: 'conversationId 必须是字符串' })
  conversationId?: string

  @IsOptional()
  @IsString({ message: 'currentPath 必须是字符串' })
  currentPath?: string

  @IsOptional()
  @IsBoolean({ message: 'useWebSearch 必须是布尔值' })
  useWebSearch?: boolean

  @IsOptional()
  @IsBoolean({ message: 'autoApply 必须是布尔值' })
  autoApply?: boolean

  @IsOptional()
  @IsArray({ message: 'history 必须是数组' })
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  history?: ChatHistoryItemDto[]
}
