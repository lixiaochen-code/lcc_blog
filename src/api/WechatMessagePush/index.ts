import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * 微信消息推送 - GET config
 * @param params 查询参数
 */
export const getWxMsgConfig = (params?: Types.WxMsgConfigQueryParams) =>
  alovaInst.Get<Types.WxMsgConfigGetResponse>('/wx/msg/config', {
    params,
  })

/**
 * 微信消息推送 - POST config
 */
export const postWxMsgConfig = () => alovaInst.Post<Types.WxMsgConfigPostResponse>('/wx/msg/config')
