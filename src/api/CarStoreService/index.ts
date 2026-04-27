import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * 门店详情
 * @param params 请求参数
 */
export const getStoreDetail = (params: Types.StoreDetailParams) =>
  alovaInst.Get<Types.StoreDetailInfo>(`/wx/stores/detail/${params.id}`, {
    params: {
      latitude: params.latitude,
      longitude: params.longitude,
    },
  })

/**
 * 实时门店信息列表
 * @param params 请求参数
 */
export const getStoreList = (params: Types.StoreListParams) =>
  alovaInst.Get<Types.StoreListResponse>('/wx/stores/list', { params })

/**
 * 门店服务列表查询
 * @param params 请求参数
 */
export const getStoreServiceList = (params: Types.StoreServiceListParams) =>
  alovaInst.Get<Types.StoreServiceListResponse>('/wx/stores/service/list', { params })

/**
 * 服务类型列表
 * @param params 请求参数
 */
export const getServiceTypeList = (params: Types.ServiceTypeListParams) =>
  alovaInst.Get<Types.ServiceTypeListResponse>('/wx/stores/service/type/list', { params })

/**
 * 服务详情
 * @param params 请求参数
 */
export const getServiceDetail = (params: { id: number }) =>
  alovaInst.Get<Types.ServiceDetailResponse>(`/wx/stores/service/detail/${params.id}`)
