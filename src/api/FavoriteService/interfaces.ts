export interface CollectAddOrDeleteRequest {
  /** type 1:服务 2:店铺 */
  type: number
  /** 对应ID */
  valueId: number
}

export interface CollectListParams {
  /** 每页数量 */
  limit?: number
  /** 排序规则 */
  order?: string
  /** 页码 */
  page?: number
  /** 排序字段 */
  sort?: string
  /** 类型 1:服务 2:店铺 */
  type?: number
}

export interface CollectItem {
  id: number
  name?: string
  brief?: string
  picUrl: string
  retailPrice?: number
  type: number
  valueId: number
  storeName?: string
  storeAddress?: string
  collect_exist?: boolean
  latitude?: number
  longitude?: number
}

export interface CollectListResponse {
  total: number
  pages: number
  limit: number
  page: number
  list: CollectItem[]
}

export interface CommonResponse<T = any> {
  errno: number
  errmsg: string
  data: T
}
