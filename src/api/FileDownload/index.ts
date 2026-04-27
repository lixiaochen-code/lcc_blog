import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * downloadLocal
 * @description 接口地址: /EOI6kS4mnQ.txt
 */
export const downloadLocal = () => alovaInst.Get<Types.DownloadLocalResponse>('/EOI6kS4mnQ.txt')

/**
 * 发送验证码
 * @description 接口地址: /sendPhoneCode
 * @param params SendPhoneCodeParams
 */
export const sendPhoneCode = (params: Types.SendPhoneCodeParams) =>
  alovaInst.Post<Types.SendPhoneCodeResponse>(
    '/sendPhoneCode',
    {},
    {
      params,
    }
  )
