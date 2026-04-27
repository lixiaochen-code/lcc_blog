export interface ContactUsResponse {
  phone?: string
  email?: string
  address?: string
  wechat?: string
  [key: string]: any
}

export interface JoinRulesResponse {
  content?: string
  title?: string
  updatedAt?: string
  [key: string]: any
}
