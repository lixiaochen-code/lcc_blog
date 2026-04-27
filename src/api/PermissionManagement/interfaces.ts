export interface BindPhoneParams {
  body: string
  userId?: number
}

export interface CaptchaParams {
  body: string
  userId?: number
}

export interface LoginParams {
  body: string
}

export interface UserInfo {
  avatarUrl?: string
  city?: string
  country?: string
  gender?: number
  language?: string
  nickName?: string
  province?: string
  /** 推荐人用户ID（没有则不传） */
  referrerUserId?: number
}

export interface WxLoginInfo {
  code?: string
  userInfo?: UserInfo
}

export interface LogoutParams {
  userId?: number
}

export interface ProfileParams {
  body: string
  userId?: number
}

export interface RegCaptchaParams {
  body: string
}

export interface RegisterParams {
  body: string
}

export interface ResetParams {
  body: string
}

export interface ResetPhoneParams {
  body: string
  userId?: number
}

export interface ApiResponse<T = any> {
  code?: number
  msg?: string
  data?: T
}
