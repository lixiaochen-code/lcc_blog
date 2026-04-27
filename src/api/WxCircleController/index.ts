import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * 新闻/公告详情
 * @param params WxCircleInfoParams
 */
export const getWxCircleInfo = (params: Types.WxCircleInfoParams) =>
  alovaInst.Get<Types.WxCircleInfoResponse>('/wx/circle/info', {
    params,
  })
