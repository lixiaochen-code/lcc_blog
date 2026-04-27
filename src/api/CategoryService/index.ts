import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * 查询所有类目数据
 */
export const queryAll = () => alovaInst.Get<Types.QueryAllResponse>('/wx/catalog/all')

/**
 * 获取当前类目信息
 * @param params 请求参数
 */
export const current = (params?: Types.CurrentParams) =>
  alovaInst.Get<Types.CurrentResponse>('/wx/catalog/current', { params })

/**
 * 获取一级类目
 */
export const getFirstCategory = () =>
  alovaInst.Get<Types.GetFirstCategoryResponse>('/wx/catalog/getfirstcategory')

/**
 * 获取二级类目
 * @param params 请求参数
 */
export const getSecondCategory = (params?: Types.GetSecondCategoryParams) =>
  alovaInst.Get<Types.GetSecondCategoryResponse>('/wx/catalog/getsecondcategory', { params })

/**
 * 类目首页数据
 * @param params 请求参数
 */
export const index = (params?: Types.IndexParams) =>
  alovaInst.Get<Types.IndexResponse>('/wx/catalog/index', { params })
