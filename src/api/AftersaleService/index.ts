import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * 取消售后申请
 * @param data 请求体参数
 */
export const cancelAftersale = (data: Types.CancelRequest) =>
  alovaInst.Post<Types.CommonResponse>('/wx/aftersale/cancel', data)

/**
 * 售后详情
 * @param params 查询参数
 */
export const getAftersaleDetail = (params: Types.DetailParams) =>
  alovaInst.Get<Types.CommonResponse>('/wx/aftersale/detail', { params })

/**
 * 售后列表
 * @param params 查询参数
 */
export const getAftersaleList = (params: Types.ListParams) =>
  alovaInst.Get<Types.CommonResponse>('/wx/aftersale/list', { params })

/**
 * 提交售后申请
 * @param data 请求体参数
 */
export const submitAftersale = (data: Types.SubmitRequest) =>
  alovaInst.Post<Types.CommonResponse>('/wx/aftersale/submit', data)
