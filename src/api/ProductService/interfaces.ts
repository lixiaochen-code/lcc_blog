export interface CategoryParams {
  /**
   * id
   */
  id?: number
}

export interface CountResponse {
  [key: string]: any
}

export interface DetailParams {
  /**
   * id
   */
  id?: number
  /**
   * userId
   */
  userId?: number
}

export interface ListParams {
  /**
   * brandId
   */
  brandId?: number
  /**
   * categoryId
   */
  categoryId?: number
  /**
   * isHot
   */
  isHot?: boolean
  /**
   * isNew
   */
  isNew?: boolean
  /**
   * keyword
   */
  keyword?: string
  /**
   * limit
   */
  limit?: number
  /**
   * order
   */
  order?: string
  /**
   * page
   */
  page?: number
  /**
   * sort
   */
  sort?: string
  /**
   * userId
   */
  userId?: number
}

export interface RelatedParams {
  /**
   * id
   */
  id?: number
}

export interface CommonResponse {
  [key: string]: any
}
