export interface CatalogItem {
  id?: number
  name?: string
  keywords?: string
  desc?: string
  pid?: number
  iconUrl?: string
  picUrl?: string
  level?: string
  sortOrder?: number
  addTime?: string
  updateTime?: string
  deleted?: boolean
}

export interface QueryAllResponse {
  errno: number
  data: CatalogItem[]
  errmsg: string
}

export interface CurrentParams {
  id?: number
}

export interface CurrentResponse {
  errno: number
  data: {
    currentCategory: CatalogItem
    currentSubCategory: CatalogItem[]
  }
  errmsg: string
}

export interface GetFirstCategoryResponse {
  errno: number
  data: CatalogItem[]
  errmsg: string
}

export interface GetSecondCategoryParams {
  id?: number
}

export interface GetSecondCategoryResponse {
  errno: number
  data: CatalogItem[]
  errmsg: string
}

export interface IndexParams {
  id?: number
}

export interface IndexResponse {
  errno: number
  data: {
    categoryList: CatalogItem[]
    currentCategory: CatalogItem
    currentSubCategory: CatalogItem[]
  }
  errmsg: string
}
