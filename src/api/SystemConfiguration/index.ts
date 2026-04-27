import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * 获取联系我们配置信息
 * @returns {Promise<Types.ContactUsResponse>} 联系我们详情
 */
export const getContactUs = () =>
  alovaInst.Get<Types.ContactUsResponse>('/wx/sys_config/contact_us')

/**
 * 获取客服电话
 * @returns {Promise<string>} 客服电话号码
 */
export const getMallPhone = () => alovaInst.Get<string>('/wx/sys_config/mall_phone')

/**
 * 获取入驻条例配置信息
 * @returns {Promise<Types.JoinRulesResponse>} 入驻条例详情
 */
export const getJoinRules = () =>
  alovaInst.Get<Types.JoinRulesResponse>('/wx/sys_config/join_rules')
