// TODO: 待真实接口验证，当前基于 recommendServers 结构推断
// packageServers 字段结构与 recommendServers 一致

/** 套餐列表查询参数 */
export interface PackageListParams {
  pageNumber?: number
  pageSize?: number
}

/** 套餐项（与 RecommendServerItem 结构一致） */
export interface PackageServerItem {
  id: number
  serviceCode: string
  serviceTarget: string
  name: string
  brief?: string
  type: number
  picUrl: string
  isOnSale: boolean
  isRecommend: boolean
  price: number
  costPrice?: number
}

/** 套餐列表响应 */
export interface PackageListResponse {
  list?: PackageServerItem[]
  records?: PackageServerItem[]
  total?: number
  [key: string]: any
}

/** 套餐详情（与服务详情结构一致） */
export interface PackageDetailItem {
  id: number
  serviceCode: string
  name: string
  brief?: string
  price: number
  costPrice?: number
  picUrl: string
  gallery?: string
  detail?: string
  specifications?: string
  storeId?: number
  [key: string]: any
}

export interface PackageDetailResponse {
  data?: PackageDetailItem
  [key: string]: any
}
