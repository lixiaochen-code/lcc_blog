import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * getSign
 * @param params GetSignParams 请求参数
 */
export const getSign = (params: Types.GetSignParams) =>
  alovaInst.Get<Types.GetSignResponse>('/wx/payment/org_password', {
    params,
  })
