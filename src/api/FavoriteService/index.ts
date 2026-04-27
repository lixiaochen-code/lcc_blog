import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * 收藏或者取消
 * @param {Types.CollectAddOrDeleteRequest} data 收藏请求参数
 */
export const addOrDeleteCollect = (data: Types.CollectAddOrDeleteRequest) =>
  alovaInst.Post<Types.CommonResponse<string>>('/wx/collect/addordelete', data)

/**
 * 获取收藏列表
 * @param {Types.CollectListParams} params 查询参数
 */
export const getCollectList = (params: Types.CollectListParams) =>
  alovaInst.Get<Types.CollectListResponse>('/wx/collect/list', {
    params,
  })
