import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * clearhistory
 * @param data 请求体参数
 */
export const clearHistory = (data: Types.ClearHistoryRequest) =>
  alovaInst.Post<Types.AnyResponse>('/wx/search/clearhistory', data)

/**
 * helper
 * @param params 查询参数
 * @param data 请求体参数 (keyword)
 */
export const getHelper = (
  params: Omit<Types.HelperRequest, 'keyword'>,
  data: Pick<Types.HelperRequest, 'keyword'>
) =>
  alovaInst.Get<Types.AnyResponse>('/wx/search/helper', {
    params,
    data,
  })

/**
 * index
 * @param data 请求体参数 (userId)
 */
export const getIndex = (data: Types.IndexRequest) =>
  alovaInst.Get<Types.AnyResponse>('/wx/search/index', {
    data,
  })
