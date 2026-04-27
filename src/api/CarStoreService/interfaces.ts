export interface StoreDetailParams {
  /**
   * id
   */
  id: number
  /**
   * latitude
   */
  latitude?: number
  /**
   * longitude
   */
  longitude?: number
}

export interface StoreListParams {
  /**
   * keyWord
   */
  keyWord?: string
  /**
   * latitude
   */
  latitude?: number
  /**
   * limit
   */
  limit?: number
  /**
   * longitude
   */
  longitude?: number
  /**
   * page
   */
  page?: number
}

export interface StoreServiceListParams {
  /**
   * category
   */
  category?: number
  /**
   * keyWord
   */
  keyWord?: string
  /**
   * latitude
   */
  latitude?: number
  /**
   * limit
   */
  limit?: number
  /**
   * longitude
   */
  longitude?: number
  /**
   * page
   */
  page?: number
  /**
   * serverCode
   */
  serviceCode?: string
}

export interface ServiceTypeListParams {
  /**
   * category
   */
  category?: number
}

export interface StoreInfo {
  id: number
  name: string
  address: string
  city: string
  district: string
  latitude: number
  longitude: number
  brief: string
  gallery: string
  phone: string
  picUrl: string
  status: number
  distance: number
  serverTag: string
}

export interface StoreListItem {
  stores: StoreInfo
  distance: number
  businessTime: string[][]
  star: number
}

export interface StoreListResponse {
  list?: StoreListItem[]
  records?: StoreListItem[]
  data?: StoreListItem[]
  total?: number
}

export interface CarUserStaffItem {
  id: number
  storeId: number
  userId: number
  name: string
  phone: string
  role: string
  workStatus: number
  addTime: string
  updateTime: string
  deleted: boolean
}

export interface CarStoreServiceItem {
  id: number
  name: string
  brief: string
  price: number
  picUrl: string
  serviceCode: string
  specifications?: string
}

export interface StoreDetailInfo {
  orderTotal: number
  goodCommentRate: number
  isCollect: boolean
  realTimeInfo: {
    stores: StoreInfo
    distance: number
    businessTime: string[][]
    star: number
  }
  carUserStaffList: CarUserStaffItem[]
  carStoreServicesList: CarStoreServiceItem[]
}

export interface StoreDetailResponse {
  data?: StoreDetailInfo
}
export interface StoreServiceListItem {
  id?: number
  serviceName: string
  serviceCode?: string
  category: string
  price: number
  storeName: string
  storeId?: number
  address: string
  brief: string
  businessTime: string[][]
  distance: number
  picUrl?: string
}
export type StoreServiceListResponse = PagesRequest<StoreServiceListItem>
export interface ServiceTypeListItem {
  id: number
  serviceCode: string
  serviceTarget: string
  name: string
  brief: string
  type: number
  picUrl: string
}
export type ServiceTypeListResponse = {
  total: number
  pages: number
  limit: number
  page: number
  list: ServiceTypeListItem[]
}

export type ServiceDetailResponse = {
  id: number
  storeId: number
  name: string
  serviceCode: string
  category: string
  gallery: string
  brief: string
  picUrl: string
  orderSort: 1
  isOnSale: boolean
  price: number
  specifications: string
  costPrice: number
  updateTime: string
  addTime: string
  deleted: boolean
  detail: string
}
