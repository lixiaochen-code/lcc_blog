import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * 服务类型缓存更新
 * @description 更新微信服务类型的缓存数据
 */
export const updateServiceTypeCache = () =>
  alovaInst.Post<Types.ServiceTypeCacheResponse>('/wx/cache/service_type')
