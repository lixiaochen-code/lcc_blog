import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * about
 */
export const getAbout = () => alovaInst.Get<Types.AboutResponse>('/wx/home/about')

/**
 * cache
 * @param params 请求参数
 */
export const getCache = (params?: Types.CacheParams) =>
  alovaInst.Get<Types.CacheResponse>('/wx/home/cache', {
    params,
  })

/**
 * index
 * @param params 请求参数
 */
export const getIndex = (params?: Types.IndexParams) =>
  alovaInst.Get<Types.IndexResponse>('/wx/home/index', {
    params,
  })
