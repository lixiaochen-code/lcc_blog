import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * 入驻协议
 * @param params 请求参数
 */
export const getEntryAgreement = (params?: Types.UserQuery) =>
  alovaInst.Get<any>('/wx/user/entry_agreement', { params })

/**
 * list
 * @param params 请求参数
 */
export const getUserIndex = (params?: Types.UserQuery) =>
  alovaInst.Get<any>('/wx/user/index', { params })

/**
 * 用户信息
 * @param params 请求参数
 */
export const getUserInfo = (params?: Types.UserQuery) =>
  alovaInst.Get<Types.MallUser>('/wx/user/info', { params })

/**
 * 用户信息修改
 * @param data 请求体
 */
export const updateUserInfo = (data: Types.MallUser) => alovaInst.Post<any>('/wx/user/update', data)

/**
 * 修改店员/店长信息（仅支持 name、avatarUrl、phone、desc）
 */
export const updateStaff = (data: Types.StaffUpdateVO) =>
  alovaInst.Post<any>('/wx/user/update_staff', data)

/**
 * 用户分享二维码
 * @param params userId (可选)
 */
export const getStaffQrCode = (params?: { userId?: number }) =>
  alovaInst.Get<string>('/wx/user/staff_qr_code', { params })
