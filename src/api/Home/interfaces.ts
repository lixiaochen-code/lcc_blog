export interface AboutResponse {
  [key: string]: any
}

export interface CacheParams {
  key?: string
}

export interface CacheResponse {
  [key: string]: any
}

export interface IndexParams {
  latitude?: number
  longitude?: number
  userId?: number
}

export interface BannerItem {
  url: string
  [key: string]: any
}

export interface RecommendServerItem {
  name: string
  brief?: string
  price: number
  costPrice?: number
  picUrl: string
  [key: string]: any
}

export interface ChannelItem {
  id: number
  iconUrl: string
  name: string
}

export interface HomeIndexData {
  banner?: BannerItem[]
  recommendServers?: RecommendServerItem[]
  packageServers?: RecommendServerItem[]
  channel?: ChannelItem[]
  [key: string]: any
}

export type BaseResponse<T> = {
  data: T
  code?: number
  msg?: string
}

export interface IndexResponse extends BaseResponse<HomeIndexData> {}
