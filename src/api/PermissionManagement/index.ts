import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * 绑定手机号
 * @param data {code:xxx,iv:xxx}
 */
export const bindPhone = (data: Types.BindPhoneParams) =>
  alovaInst.Post<Types.ApiResponse>('/wx/auth/bindPhone', data)

/**
 * captcha
 */
export const captcha = (data: Types.CaptchaParams) =>
  alovaInst.Post<Types.ApiResponse>('/wx/auth/captcha', data)

/**
 * login
 */
export const login = (data: Types.LoginParams) =>
  alovaInst.Post<Types.ApiResponse>('/wx/auth/login', data)

/**
 * loginByWeixin
 * @param data wx登录信息
 */
export const loginByWeixin = (data: Types.WxLoginInfo) =>
  alovaInst.Post<Types.ApiResponse>('/wx/auth/login_by_weixin', data)

/**
 * logout
 */
export const logout = (data: Types.LogoutParams) =>
  alovaInst.Post<Types.ApiResponse>('/wx/auth/logout', data)

/**
 * profile
 */
export const profile = (data: Types.ProfileParams) =>
  alovaInst.Post<Types.ApiResponse>('/wx/auth/profile', data)

/**
 * registerCaptcha
 */
export const registerCaptcha = (data: Types.RegCaptchaParams) =>
  alovaInst.Post<Types.ApiResponse>('/wx/auth/regCaptcha', data)

/**
 * register
 */
export const register = (data: Types.RegisterParams) =>
  alovaInst.Post<Types.ApiResponse>('/wx/auth/register', data)

/**
 * reset
 */
export const reset = (data: Types.ResetParams) =>
  alovaInst.Post<Types.ApiResponse>('/wx/auth/reset', data)

/**
 * resetPhone
 */
export const resetPhone = (data: Types.ResetPhoneParams) =>
  alovaInst.Post<Types.ApiResponse>('/wx/auth/resetPhone', data)
