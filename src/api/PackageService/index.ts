import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * 套餐列表
 * @param params 请求参数
 * TODO: 待后端接口上线后验证
 */
export const getPackageList = (params: Types.PackageListParams) =>
  alovaInst.Get<Types.PackageListResponse>('/wx/stores/service/package/list', { params })

/**
 * 套餐详情
 * @param params 请求参数
 * TODO: 待后端接口上线后验证
 */
export const getPackageDetail = (params: { id: number }) =>
  alovaInst.Get<Types.PackageDetailResponse>(`/wx/stores/package/detail/${params.id}`)
