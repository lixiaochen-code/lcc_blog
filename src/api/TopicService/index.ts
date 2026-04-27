import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * 获取品牌详情
 * @param params BrandDetailParams
 */
export const getBrandDetail = (params: Types.BrandDetailParams) =>
  alovaInst.Get<Types.ApiResponse>('/wx/brand/detail', { params })

/**
 * 获取品牌列表
 * @param params BrandListParams
 */
export const getBrandList = (params: Types.BrandListParams) =>
  alovaInst.Get<Types.ApiResponse>('/wx/brand/list', { params })

/**
 * 获取专题详情
 * @param params TopicDetailParams
 */
export const getTopicDetail = (params: Types.TopicDetailParams) =>
  alovaInst.Get<Types.ApiResponse>('/wx/topic/detail', { params })

/**
 * 获取专题列表
 * @param params TopicListParams
 */
export const getTopicList = (params: Types.TopicListParams) =>
  alovaInst.Get<Types.ApiResponse>('/wx/topic/list', { params })

/**
 * 获取相关专题
 * @param params TopicRelatedParams
 */
export const getTopicRelated = (params: Types.TopicRelatedParams) =>
  alovaInst.Get<Types.ApiResponse>('/wx/topic/related', { params })
