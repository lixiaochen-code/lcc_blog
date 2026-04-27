import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * category
 * @param params CategoryParams
 */
export const getCategory = (params?: Types.CategoryParams) =>
  alovaInst.Get<Types.CommonResponse>('/wx/goods/category', {
    params,
  })

/**
 * count
 */
export const getCount = () => alovaInst.Get<Types.CountResponse>('/wx/goods/count')

/**
 * 商品详情
 * @param params DetailParams
 */
export const getDetail = (params?: Types.DetailParams) =>
  alovaInst.Get<Types.CommonResponse>('/wx/goods/detail', {
    params,
  })

/**
 * list
 * @param params ListParams
 */
export const getList = (params?: Types.ListParams) =>
  alovaInst.Get<Types.CommonResponse>('/wx/goods/list', {
    params,
  })

/**
 * related
 * @param params RelatedParams
 */
export const getRelated = (params?: Types.RelatedParams) =>
  alovaInst.Get<Types.CommonResponse>('/wx/goods/related', {
    params,
  })
